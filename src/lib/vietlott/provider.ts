import { getVietlottProduct } from './catalog';
import { readCachedVietlottResult, readRecentCachedVietlottResults, writeCachedVietlottResult, writeCachedVietlottResults } from './cache';
import { isFutureDate, isYyyyMmDd, todayInVietnam } from './format';
import { fetchRecentVietlottFromHtml, fetchVietlottFromHtml } from './html';
import { mockRecentVietlott, mockVietlottByDate, mockVietlottLatest } from './mock';
import { isValidVietlottResult, normalizeVietlottApiResult } from './normalize';
import type { VietlottProviderMode, VietlottResult } from './types';

function providerMode(): VietlottProviderMode {
  const value = (process.env.VIETLOTT_PROVIDER || process.env.LOTTERY_PROVIDER || 'mock').toLowerCase();
  if (value === 'api' || value === 'html' || value === 'auto' || value === 'mock') return value;
  return 'mock';
}

function allowMockFallback() {
  if (process.env.VIETLOTT_ALLOW_MOCK_FALLBACK === 'false' || process.env.LOTTERY_ALLOW_MOCK_FALLBACK === 'false') return false;
  if (process.env.VIETLOTT_ALLOW_MOCK_FALLBACK === 'true' || process.env.LOTTERY_ALLOW_MOCK_FALLBACK === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

function normalizeDate(date?: string) {
  if (!date) return todayInVietnam();
  if (!isYyyyMmDd(date)) throw new Error('Ngày phải có định dạng YYYY-MM-DD');
  return date;
}

async function fetchFromExternalApi(productId: string, date: string): Promise<VietlottResult | null> {
  const product = getVietlottProduct(productId);
  const endpoint = process.env.VIETLOTT_DATA_API;
  if (!product || !endpoint) return null;

  const url = new URL(endpoint);
  url.searchParams.set('product', product.id);
  url.searchParams.set('date', date);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      ...(process.env.VIETLOTT_API_KEY ? { Authorization: `Bearer ${process.env.VIETLOTT_API_KEY}` } : {})
    },
    next: { revalidate: Number(process.env.VIETLOTT_REVALIDATE_SECONDS || process.env.LOTTERY_REVALIDATE_SECONDS || 60) }
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Không lấy được Vietlott API: ${response.status}`);

  return normalizeVietlottApiResult(await response.json(), product);
}

async function fetchHistoryFromExternalApi(productId: string, limit = 30): Promise<VietlottResult[]> {
  const product = getVietlottProduct(productId);
  const endpoint = process.env.VIETLOTT_HISTORY_API;
  if (!product || !endpoint) return [];

  const url = new URL(endpoint);
  url.searchParams.set('product', product.id);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      ...(process.env.VIETLOTT_API_KEY ? { Authorization: `Bearer ${process.env.VIETLOTT_API_KEY}` } : {})
    },
    next: { revalidate: Number(process.env.VIETLOTT_REVALIDATE_SECONDS || process.env.LOTTERY_REVALIDATE_SECONDS || 60) }
  });

  if (!response.ok) return [];
  const payload = await response.json();
  const rawResults = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  return rawResults
    .map((item: unknown) => normalizeVietlottApiResult(item, product))
    .filter((item: VietlottResult | null): item is VietlottResult => Boolean(item))
    .sort((a: VietlottResult, b: VietlottResult) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

function better(current: VietlottResult | null, next: VietlottResult | null) {
  if (!current) return next;
  if (!next) return current;
  const currentScore = current.numbers.length + current.rows.length * 2 + (current.bonusNumber ? 1 : 0);
  const nextScore = next.numbers.length + next.rows.length * 2 + (next.bonusNumber ? 1 : 0);
  return nextScore >= currentScore ? next : current;
}

function completeList(results: VietlottResult[], limit?: number) {
  const valid = results.filter(isValidVietlottResult);
  return typeof limit === 'number' ? valid.slice(0, limit) : valid;
}

function mergeRecentResults(...groups: VietlottResult[][]) {
  const byDate = new Map<string, VietlottResult>();

  for (const result of groups.flat().filter(isValidVietlottResult)) {
    const current = byDate.get(result.date) || null;
    byDate.set(result.date, better(current, result)!);
  }

  return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date));
}

async function fetchVietlottFromRecentHistory(productId: string, date: string, limit = 60) {
  const product = getVietlottProduct(productId);
  if (!product) return null;

  const history = completeList(await fetchRecentVietlottFromHtml(product, limit).catch(() => []));
  if (history.length) await writeCachedVietlottResults(history);

  return history.find((item) => item.date === date) || null;
}

export async function getVietlottResult(productId = 'mega-645', date?: string): Promise<VietlottResult | null> {
  const product = getVietlottProduct(productId);
  if (!product) return null;

  const normalizedDate = normalizeDate(date);
  if (isFutureDate(normalizedDate)) return null;

  const mode = providerMode();

  if (mode === 'mock') return mockVietlottByDate(product.id, normalizedDate);

  let best: VietlottResult | null = await readCachedVietlottResult(product.id, normalizedDate);
  if (isValidVietlottResult(best)) return best;

  if (mode === 'api' || mode === 'auto') {
    best = better(best, await fetchFromExternalApi(product.id, normalizedDate).catch(() => null));
    if (isValidVietlottResult(best)) {
      await writeCachedVietlottResult(best);
      return best;
    }
  }

  if (mode === 'html' || mode === 'auto') {
    best = better(best, await fetchVietlottFromHtml(product, normalizedDate).catch(() => null));
    if (isValidVietlottResult(best)) {
      await writeCachedVietlottResult(best);
      return best;
    }

    // Một số trang ngày lẻ của XSKT có thể trả trang rỗng,
    // trong khi trang 30 ngày vẫn có dữ liệu. Vì vậy khi xem lịch sử
    // theo ngày, thử lấy từ trang 30 ngày rồi khớp lại đúng date.
    best = better(best, await fetchVietlottFromRecentHistory(product.id, normalizedDate));
    if (isValidVietlottResult(best)) {
      await writeCachedVietlottResult(best);
      return best;
    }
  }

  const cachedAfterFetch = await readCachedVietlottResult(product.id, normalizedDate);
  best = better(best, cachedAfterFetch);
  if (isValidVietlottResult(best)) return best;

  return allowMockFallback() ? mockVietlottByDate(product.id, normalizedDate) : null;
}

export async function getLatestVietlottResult(productId = 'mega-645') {
  const product = getVietlottProduct(productId);
  if (!product) return null;

  const mode = providerMode();
  if (mode === 'mock') return mockVietlottLatest(product.id);

  let best: VietlottResult | null = null;
  const today = todayInVietnam();

  if (mode === 'api' || mode === 'auto') {
    best = better(best, await fetchFromExternalApi(product.id, today).catch(() => null));
    if (isValidVietlottResult(best)) {
      await writeCachedVietlottResult(best);
      return best;
    }
  }

  if (mode === 'html' || mode === 'auto') {
    best = better(best, await fetchVietlottFromHtml(product).catch(() => null));
    if (isValidVietlottResult(best)) {
      await writeCachedVietlottResult(best);
      return best;
    }

    const history = completeList(await fetchRecentVietlottFromHtml(product, 10).catch(() => []));
    if (history.length) {
      await writeCachedVietlottResults(history);
      best = better(best, history[0]);
      if (isValidVietlottResult(best)) return best;
    }
  }

  const cached = completeList(await readRecentCachedVietlottResults(product.id, 1));
  if (isValidVietlottResult(cached[0] || null)) return cached[0];

  return allowMockFallback() ? mockVietlottLatest(product.id) : null;
}

export async function getRecentVietlottResults(productId = 'mega-645', limit = 30) {
  const product = getVietlottProduct(productId);
  if (!product) return [];

  const mode = providerMode();
  if (mode === 'mock') return mockRecentVietlott(product.id, limit);

  const groups: VietlottResult[][] = [];

  if (mode === 'api' || mode === 'auto') {
    const apiResults = completeList(await fetchHistoryFromExternalApi(product.id, limit).catch(() => []), limit);
    if (apiResults.length) groups.push(apiResults);
  }

  if (mode === 'html' || mode === 'auto') {
    const htmlResults = completeList(await fetchRecentVietlottFromHtml(product, limit).catch(() => []), limit);
    if (htmlResults.length) groups.push(htmlResults);
  }

  const cached = completeList(await readRecentCachedVietlottResults(product.id, limit), limit);
  if (cached.length) groups.push(cached);

  const merged = mergeRecentResults(...groups).slice(0, limit);
  if (merged.length) {
    await writeCachedVietlottResults(merged);
    return merged;
  }

  return allowMockFallback() ? mockRecentVietlott(product.id, limit) : [];
}

export function getVietlottRuntimeConfig() {
  return {
    provider: providerMode(),
    hasApiEndpoint: Boolean(process.env.VIETLOTT_DATA_API),
    hasHistoryEndpoint: Boolean(process.env.VIETLOTT_HISTORY_API),
    fileCacheEnabled: process.env.VIETLOTT_FILE_CACHE !== 'false' && process.env.LOTTERY_FILE_CACHE !== 'false',
    allowMockFallback: allowMockFallback()
  };
}
