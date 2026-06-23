import { getLotterySource } from './catalog';
import type { LotteryLiveResult, LotteryResult, ProviderMode } from './types';
import { isFutureDate, isYyyyMmDd, todayInVietnam } from './format';
import { isCompleteLotteryResult, liveResultToCompleteLotteryResult, normalizeApiResult, normalizeLiveApiResult, pickBetterLotteryResult } from './normalize';
import { fetchLiveLotteryFromRss, fetchLotteryFromRss } from './rss';
import { mergeLiveLotteryResults } from './live-state';
import { fetchLiveLotteryFromHtml, fetchLotteryFromHtml, fetchRecentLotteryFromHtml } from './html';
import { readCachedResult, readRecentCachedResults, writeCachedResult, writeCachedResults } from './cache';
import { mockByCodeDate, mockLatestByCode, mockRecentByCode } from './mock';

function providerMode(): ProviderMode {
  const value = (process.env.LOTTERY_PROVIDER || process.env.XSMB_PROVIDER || 'auto').toLowerCase();
  if (value === 'api' || value === 'rss' || value === 'html' || value === 'auto' || value === 'mock') return value;
  return 'auto';
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


async function fetchLiveFromExternalApi(code: string, date: string): Promise<LotteryLiveResult | null> {
  const source = resolveSource(code);
  const endpoint = process.env.LOTTERY_LIVE_API || process.env.XSMB_LIVE_API || process.env.LOTTERY_DATA_API || process.env.XSMB_DATA_API;
  if (!endpoint) return null;

  const url = new URL(endpoint);
  url.searchParams.set('code', source.code);
  url.searchParams.set('date', date);
  url.searchParams.set('live', '1');

  const timeoutMs = Number(process.env.LOTTERY_LIVE_TIMEOUT_MS || process.env.XSMB_LIVE_TIMEOUT_MS || 5000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 5000);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        ...(process.env.LOTTERY_API_KEY || process.env.XSMB_API_KEY
          ? { Authorization: `Bearer ${process.env.LOTTERY_API_KEY || process.env.XSMB_API_KEY}` }
          : {})
      },
      cache: 'no-store',
      signal: controller.signal
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Không lấy được dữ liệu live từ API: ${response.status}`);

    const result = normalizeLiveApiResult(await response.json(), source, { date, sourceName: 'API tường thuật xổ số' });
    return result && result.date === date ? result : null;
  } finally {
    clearTimeout(timeout);
  }
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

function completeResultToLive(result: LotteryResult): LotteryLiveResult {
  const score = result.prizes.reduce((total, row) => total + row.numbers.length, 0);
  return {
    ...result,
    isComplete: true,
    status: 'complete',
    completenessScore: score,
    expectedScore: score
  };
}

function completeList(results: LotteryResult[], limit?: number) {
  const complete = results.filter(isCompleteLotteryResult);
  return typeof limit === 'number' ? complete.slice(0, limit) : complete;
}

function mergeLotteryResults(...groups: LotteryResult[][]) {
  const byDate = new Map<string, LotteryResult>();

  for (const result of groups.flat().filter(isCompleteLotteryResult)) {
    const current = byDate.get(result.date) || null;
    byDate.set(result.date, pickBetterLotteryResult(current, result)!);
  }

  return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date));
}

async function fetchLotteryFromRecentHistory(code: string, date: string, limit = 60) {
  const source = resolveSource(code);
  const history = completeList(await fetchRecentLotteryFromHtml(source, limit).catch(() => []));
  if (history.length) await writeCachedResults(history);
  return history.find((item) => item.date === date) || null;
}


export async function getLiveLotteryResult(code = 'xsmb', date?: string): Promise<LotteryLiveResult | null> {
  const source = resolveSource(code);
  const normalizedDate = normalizeDate(date);
  if (isFutureDate(normalizedDate)) return null;

  const mode = providerMode();
  if (mode === 'mock') {
    const mock = onlyComplete(mockByCodeDate(source.code, normalizedDate));
    return mock ? completeResultToLive(mock) : null;
  }

  const cached = await readCachedResult(source.code, normalizedDate);
  if (isCompleteLotteryResult(cached) && cached.dataSource !== 'mock' && !cached.isMock) {
    return completeResultToLive(cached);
  }

  // RSS/API là nguồn live chính và được gọi song song. Trang HTML chỉ là
  // fallback trong chế độ auto để không làm mọi vòng polling phải chờ HTML chậm.
  const primaryRequests: Array<Promise<LotteryLiveResult | null>> = [];

  if (mode === 'rss' || mode === 'auto') {
    primaryRequests.push(fetchLiveLotteryFromRss(source, normalizedDate, { noStore: true, cacheBust: true }));
  }

  if (mode === 'api' || mode === 'auto') {
    primaryRequests.push(fetchLiveFromExternalApi(source.code, normalizedDate));
  }

  if (mode === 'html') {
    primaryRequests.push(fetchLiveLotteryFromHtml(source, normalizedDate));
  }

  const primaryCandidates = await Promise.all(primaryRequests.map((request) => request.catch(() => null)));
  let liveResult = primaryCandidates.reduce<LotteryLiveResult | null>(
    (best, candidate) => mergeLiveLotteryResults(best, candidate),
    null
  );

  if (!liveResult && mode === 'auto' && normalizedDate === todayInVietnam()) {
    const htmlFallback = await fetchLiveLotteryFromHtml(source, normalizedDate).catch(() => null);
    liveResult = mergeLiveLotteryResults(liveResult, htmlFallback);
  }

  const complete = liveResultToCompleteLotteryResult(liveResult);
  if (complete) await writeCachedResult(complete);
  if (liveResult) return liveResult;

  // Fallback cuối chỉ dùng kết quả đầy đủ; tuyệt đối không dùng mock ngầm cho live.
  // Mock hôm nay sẽ khiến client tưởng đã hoàn tất và dừng polling nguồn thật.
  const completeResult = await getLotteryResult(source.code, normalizedDate).catch(() => null);
  if (isCompleteLotteryResult(completeResult) && completeResult.dataSource !== 'mock') {
    return completeResultToLive(completeResult);
  }

  return null;
}

export async function getLotteryResult(code = 'xsmb', date?: string): Promise<LotteryResult | null> {
  const source = resolveSource(code);
  const normalizedDate = normalizeDate(date);
  if (isFutureDate(normalizedDate)) return null;

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
  if (mode === 'html' || mode === 'auto') {
    const fromHtml = await fetchLotteryFromHtml(source, normalizedDate).catch(() => null);
    best = pickBetterLotteryResult(best, fromHtml);
    if (isCompleteLotteryResult(best)) {
      await writeCachedResult(best);
      return best;
    }

    // Một số trang ngày lẻ có thể không parse đủ,
    // nhưng trang 30 ngày vẫn có kết quả. Dùng trang lịch sử để lấp đúng ngày.
    const fromHistory = await fetchLotteryFromRecentHistory(source.code, normalizedDate).catch(() => null);
    best = pickBetterLotteryResult(best, fromHistory);
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

  if (mode === 'html' || mode === 'auto') {
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
  const today = todayInVietnam();

  if (mode === 'mock') return mockRecentByCode(source.code, limit);

  const groups: LotteryResult[][] = [];

  if (mode === 'api' || mode === 'auto') {
    const history = completeList(await fetchHistoryFromExternalApi(source.code, limit).catch(() => []), limit);
    if (history.length) groups.push(history);
  }

  if (mode === 'html' || mode === 'auto') {
    const historyFromHtml = completeList(await fetchRecentLotteryFromHtml(source, limit).catch(() => []), limit);
    if (historyFromHtml.length) groups.push(historyFromHtml);
  }

  if (mode === 'rss' || mode === 'auto') {
    const rssResults = completeList(await fetchRssAndCache(source.code).catch(() => []), limit);
    if (rssResults.length) groups.push(rssResults);
  }

  const cached = completeList(await readRecentCachedResults(source.code, limit), limit);
  if (cached.length) groups.push(cached);

  const merged = mergeLotteryResults(...groups)
    .filter((result) => result.date <= today)
    .slice(0, limit);
  if (merged.length) {
    await writeCachedResults(merged);
    return merged;
  }

  return allowMockFallback() ? completeList(mockRecentByCode(source.code, limit), limit).filter((r) => r.date <= today) : [];
}

export function getLotteryRuntimeConfig() {
  const provider = providerMode();
  const hasBuiltInLiveSource = provider === 'auto' || provider === 'rss' || provider === 'html';

  return {
    provider,
    hasApiEndpoint: Boolean(process.env.LOTTERY_DATA_API || process.env.XSMB_DATA_API),
    hasHistoryEndpoint: Boolean(process.env.LOTTERY_HISTORY_API || process.env.XSMB_HISTORY_API),
    hasLiveEndpoint: hasBuiltInLiveSource || Boolean(
      process.env.LOTTERY_LIVE_API ||
        process.env.XSMB_LIVE_API ||
        process.env.LOTTERY_DATA_API ||
        process.env.XSMB_DATA_API ||
        process.env.LOTTERY_RSS_URL ||
        process.env.XSMB_RSS_URL ||
        process.env.LOTTERY_LIVE_HTML_URL
    ),
    fileCacheEnabled: process.env.LOTTERY_FILE_CACHE !== 'false' && process.env.XSMB_FILE_CACHE !== 'false',
    allowMockFallback: allowMockFallback()
  };
}
