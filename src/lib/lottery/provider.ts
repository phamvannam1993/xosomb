import { getLotterySource } from './catalog';
import type { LotteryResult, ProviderMode } from './types';
import { isYyyyMmDd, todayInVietnam } from './format';
import { isCompleteLotteryResult, normalizeApiResult, pickBetterLotteryResult } from './normalize';
import { fetchLotteryFromRss } from './rss';
import { fetchLotteryFromHtml, fetchRecentLotteryFromHtml } from './html';
import { readCachedResult, readRecentCachedResults, writeCachedResult, writeCachedResults } from './cache';
import { mockByCodeDate, mockLatestByCode, mockRecentByCode } from './mock';

function providerMode(): ProviderMode {
  const value = (process.env.LOTTERY_PROVIDER || process.env.XSMB_PROVIDER || 'mock').toLowerCase();
  if (value === 'api' || value === 'rss' || value === 'html' || value === 'auto' || value === 'mock') return value;
  return 'mock';
}

function allowMockFallback() {
  if (process.env.LOTTERY_ALLOW_MOCK_FALLBACK === 'false' || process.env.XSMB_ALLOW_MOCK_FALLBACK === 'false') return false;
  if (process.env.LOTTERY_ALLOW_MOCK_FALLBACK === 'true' || process.env.XSMB_ALLOW_MOCK_FALLBACK === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

function normalizeDate(date?: string) {
  if (!date) return todayInVietnam();
  if (!isYyyyMmDd(date)) throw new Error('Ngày phải có định dạng YYYY-MM-DD');
  return date;
}

function resolveSource(code = 'xsmb') {
  return getLotterySource(code) || getLotterySource('xsmb')!;
}

async function fetchFromExternalApi(code: string, date: string): Promise<LotteryResult | null> {
  const source = resolveSource(code);
  const endpoint = process.env.LOTTERY_DATA_API || process.env.XSMB_DATA_API;
  if (!endpoint) return null;

  const url = new URL(endpoint);
  url.searchParams.set('code', source.code);
  url.searchParams.set('date', date);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      ...(process.env.LOTTERY_API_KEY || process.env.XSMB_API_KEY
        ? { Authorization: `Bearer ${process.env.LOTTERY_API_KEY || process.env.XSMB_API_KEY}` }
        : {})
    },
    next: { revalidate: Number(process.env.LOTTERY_REVALIDATE_SECONDS || process.env.XSMB_REVALIDATE_SECONDS || 60) }
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Không lấy được dữ liệu từ API: ${response.status}`);

  return normalizeApiResult(await response.json(), source);
}

async function fetchHistoryFromExternalApi(code: string, limit = 30): Promise<LotteryResult[]> {
  const source = resolveSource(code);
  const endpoint = process.env.LOTTERY_HISTORY_API || process.env.XSMB_HISTORY_API;
  if (!endpoint) return [];

  const url = new URL(endpoint);
  url.searchParams.set('code', source.code);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      ...(process.env.LOTTERY_API_KEY || process.env.XSMB_API_KEY
        ? { Authorization: `Bearer ${process.env.LOTTERY_API_KEY || process.env.XSMB_API_KEY}` }
        : {})
    },
    next: { revalidate: Number(process.env.LOTTERY_REVALIDATE_SECONDS || process.env.XSMB_REVALIDATE_SECONDS || 60) }
  });

  if (!response.ok) return [];
  const payload = await response.json();
  const rawResults = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  return rawResults
    .map((item: unknown) => normalizeApiResult(item, source))
    .filter((item: LotteryResult | null): item is LotteryResult => Boolean(item))
    .sort((a: LotteryResult, b: LotteryResult) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

async function fetchRssAndCache(code: string): Promise<LotteryResult[]> {
  const source = resolveSource(code);
  const results = (await fetchLotteryFromRss(source)).filter(isCompleteLotteryResult);
  await writeCachedResults(results);
  return results;
}

function onlyComplete(result: LotteryResult | null): LotteryResult | null {
  return isCompleteLotteryResult(result) ? result : null;
}

function completeList(results: LotteryResult[], limit?: number) {
  const complete = results.filter(isCompleteLotteryResult);
  return typeof limit === 'number' ? complete.slice(0, limit) : complete;
}

export async function getLotteryResult(code = 'xsmb', date?: string): Promise<LotteryResult | null> {
  const source = resolveSource(code);
  const normalizedDate = normalizeDate(date);
  const mode = providerMode();

  if (mode === 'mock') return mockByCodeDate(source.code, normalizedDate);

  let best: LotteryResult | null = await readCachedResult(source.code, normalizedDate);
  if (isCompleteLotteryResult(best)) return best;

  if (mode === 'api' || mode === 'auto') {
    const fromApi = await fetchFromExternalApi(source.code, normalizedDate).catch(() => null);
    best = pickBetterLotteryResult(best, fromApi);
    if (isCompleteLotteryResult(best)) {
      await writeCachedResult(best);
      return best;
    }
  }

  // HTML XSKT là nguồn ưu tiên để có đủ G8/G7/G6/G5/G4/G3/G2/G1/ĐB cho từng tỉnh.
  if (mode === 'html' || mode === 'auto' || mode === 'rss') {
    const fromHtml = await fetchLotteryFromHtml(source, normalizedDate).catch(() => null);
    best = pickBetterLotteryResult(best, fromHtml);
    if (isCompleteLotteryResult(best)) {
      await writeCachedResult(best);
      return best;
    }
  }

  if (mode === 'rss' || mode === 'auto') {
    const fromRss = await fetchRssAndCache(source.code).catch(() => []);
    const matched = fromRss.find((item) => item.date === normalizedDate) || null;
    best = pickBetterLotteryResult(best, matched);
    if (isCompleteLotteryResult(best)) {
      await writeCachedResult(best);
      return best;
    }
  }

  const cachedAfterFetch = await readCachedResult(source.code, normalizedDate);
  best = pickBetterLotteryResult(best, cachedAfterFetch);
  if (isCompleteLotteryResult(best)) return best;

  return allowMockFallback() ? onlyComplete(mockByCodeDate(source.code, normalizedDate)) : null;
}

export async function getLatestLotteryResult(code = 'xsmb'): Promise<LotteryResult | null> {
  const source = resolveSource(code);
  const mode = providerMode();
  const today = todayInVietnam();

  if (mode === 'mock') return mockLatestByCode(source.code);

  let best: LotteryResult | null = null;

  if (mode === 'api' || mode === 'auto') {
    const todayApi = await fetchFromExternalApi(source.code, today).catch(() => null);
    best = pickBetterLotteryResult(best, todayApi);
    if (isCompleteLotteryResult(best)) {
      await writeCachedResult(best);
      return best;
    }
  }

  if (mode === 'html' || mode === 'auto' || mode === 'rss') {
    const fromHtml = await fetchLotteryFromHtml(source).catch(() => null);
    best = pickBetterLotteryResult(best, fromHtml);
    if (isCompleteLotteryResult(best)) {
      await writeCachedResult(best);
      return best;
    }
  }

  if (mode === 'rss' || mode === 'auto') {
    const fromRss = await fetchRssAndCache(source.code).catch(() => []);
    best = pickBetterLotteryResult(best, fromRss[0] || null);
    if (isCompleteLotteryResult(best)) {
      await writeCachedResult(best);
      return best;
    }
  }

  const cached = await readRecentCachedResults(source.code, 1);
  best = pickBetterLotteryResult(best, cached[0] || null);
  if (isCompleteLotteryResult(best)) return best;

  return allowMockFallback() ? onlyComplete(mockLatestByCode(source.code)) : null;
}

export async function getRecentLotteryResults(code = 'xsmb', limit = 30): Promise<LotteryResult[]> {
  const source = resolveSource(code);
  const mode = providerMode();

  if (mode === 'mock') return mockRecentByCode(source.code, limit);

  if (mode === 'api' || mode === 'auto') {
    const history = await fetchHistoryFromExternalApi(source.code, limit).catch(() => []);
    const completeHistory = completeList(history, limit);
    if (completeHistory.length) {
      await writeCachedResults(completeHistory);
      return completeHistory;
    }
  }

  if (mode === 'html' || mode === 'auto' || mode === 'rss') {
    const historyFromHtml = await fetchRecentLotteryFromHtml(source, limit).catch(() => []);
    const completeHistoryFromHtml = completeList(historyFromHtml, limit);
    if (completeHistoryFromHtml.length) {
      await writeCachedResults(completeHistoryFromHtml);
      return completeHistoryFromHtml;
    }
  }

  if (mode === 'rss' || mode === 'auto') {
    const rssResults = completeList(await fetchRssAndCache(source.code).catch(() => []), limit);
    if (rssResults.length) return rssResults;
  }

  const cached = await readRecentCachedResults(source.code, limit);
  if (cached.length) return cached;

  return allowMockFallback() ? completeList(mockRecentByCode(source.code, limit), limit) : [];
}

export function getLotteryRuntimeConfig() {
  return {
    provider: providerMode(),
    hasApiEndpoint: Boolean(process.env.LOTTERY_DATA_API || process.env.XSMB_DATA_API),
    hasHistoryEndpoint: Boolean(process.env.LOTTERY_HISTORY_API || process.env.XSMB_HISTORY_API),
    fileCacheEnabled: process.env.LOTTERY_FILE_CACHE !== 'false' && process.env.XSMB_FILE_CACHE !== 'false',
    allowMockFallback: allowMockFallback()
  };
}
