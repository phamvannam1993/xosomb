import type { LotteryLiveResult, LotteryResult, LotterySourceConfig } from './types';
import { isCompleteLotteryResult, normalizeLiveResultFromText, normalizeResultFromText, pickBetterLiveResult } from './normalize';
import { ddMmYyyyFromDate, normalizeDateFromText, todayInVietnam, yyyyMmDdToXsktPathDate } from './format';
import { discoverPageUrl } from './discovery';
import { XSKT_BASE_URL } from './catalog';
import { cacheBustUrl, fetchWithTimeout, numberFromEnv } from '@/lib/fetch-utils';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanPageText(html: string) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function sourceTokens(source: LotterySourceConfig) {
  const provinceName = source.name.replace(/^Xổ số\s+/i, '');
  return Array.from(new Set([source.shortName, provinceName, ...(source.aliases || [])].filter(Boolean)));
}

function buildDateUrl(baseUrl: string, date?: string) {
  if (!date) return baseUrl;
  return `${baseUrl.replace(/\/$/, '')}/ngay-${yyyyMmDdToXsktPathDate(date)}`;
}

function dateTextVariants(date?: string) {
  if (!date) return [];
  const [year, month, day] = date.split('-').map(Number);
  const slashFull = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  const slashLoose = `${day}/${month}/${year}`;
  const slashNoYear = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
  const slashNoYearLoose = `${day}/${month}`;
  const dashFull = `${day}-${month}-${year}`;
  const dashNoYear = `${day}-${month}`;
  return Array.from(new Set([slashFull, slashLoose, slashNoYear, slashNoYearLoose, dashFull, dashNoYear]));
}

function extractLikelyResultSlice(text: string, source: LotterySourceConfig, date?: string, requireDateMatch = false) {
  const tokens = sourceTokens(source);
  const dates = dateTextVariants(date);
  const candidates: string[] = [];

  for (const token of tokens) {
    // Ưu tiên cụm có ngày để không lấy nhầm bảng kết quả cũ trên trang live.
    for (const dateText of dates) {
      candidates.push(`${token} ${dateText}`);
      candidates.push(`${token} ngày ${dateText}`);
      candidates.push(`${token} ngay ${dateText}`);
    }
    if (!requireDateMatch) candidates.push(token);
  }

  // Backward-compatible candidate cũ.
  if (date) {
    const dateShort = ddMmYyyyFromDate(date).replace(/\/0/g, '/');
    candidates.push(`${source.shortName} ${dateShort}`);
  }

  let start = -1;
  const normalizedText = text.toLowerCase();
  const prizeMarker = /\b(?:ĐB|DB|G\.?\s*[1-8])\b/iu;
  const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)));

  if (requireDateMatch) {
    // Một trang có thể nhắc cùng tên đài + ngày nhiều lần (menu, tin tức, bảng
    // kết quả). Duyệt mọi lần xuất hiện và chỉ nhận cụm có marker giải ở gần.
    candidateLoop: for (const candidate of uniqueCandidates) {
      const normalizedCandidate = candidate.toLowerCase();
      let searchFrom = 0;

      while (searchFrom < normalizedText.length) {
        const candidateStart = normalizedText.indexOf(normalizedCandidate, searchFrom);
        if (candidateStart < 0) break;

        const nearbyText = text.slice(candidateStart, candidateStart + 801);
        const prizeOffset = nearbyText.search(prizeMarker);
        if (prizeOffset >= 0) {
          start = candidateStart + prizeOffset;
          break candidateLoop;
        }

        searchFrom = candidateStart + Math.max(normalizedCandidate.length, 1);
      }
    }

    // Không quét cả trang khi không tìm thấy đúng kỳ quay: phần tin tức/lịch
    // phía dưới có thể chứa các dãy số trông giống kết quả.
    if (start < 0) return '';
  } else {
    for (const candidate of uniqueCandidates) {
      start = normalizedText.indexOf(candidate.toLowerCase());
      if (start >= 0) break;
    }

    if (start < 0) start = 0;
    const firstPrizeAfterStart = text.slice(start).search(prizeMarker);
    if (firstPrizeAfterStart >= 0) start += firstPrizeAfterStart;
  }

  const slice = text.slice(start);
  const stopCandidates = [
    'Tìm lô tô',
    'Tim lo to',
    'Mã ĐB',
    'Ma DB',
    'Xem thống kê',
    'Hiện thêm kết quả',
    'Ảnh và kết quả',
    'Ghi chú',
    'Tiện ích hay',
    'Tin tức'
  ];
  let end = slice.length;
  for (const token of stopCandidates) {
    const index = slice.search(new RegExp(escapeRegExp(token), 'i'));
    if (index > 20 && index < end) end = index;
  }

  return slice.slice(0, end);
}

type LiveHtmlCacheEntry = {
  expiresAt: number;
  promise: Promise<LotteryLiveResult | null>;
};

const liveHtmlCache = new Map<string, LiveHtmlCacheEntry>();

function configuredLivePageUrl(source: LotterySourceConfig) {
  const codeKey = `LOTTERY_LIVE_HTML_URL_${source.code.toUpperCase()}`;
  const regionKey = `LOTTERY_LIVE_HTML_URL_${source.region.toUpperCase()}`;
  const configured = process.env[codeKey] || process.env[regionKey] || process.env.LOTTERY_LIVE_HTML_URL;
  if (configured) return configured;

  if (source.code === 'xsmb') return `${XSKT_BASE_URL}/xo-so-truc-tiep/mien-bac-xsmb.html`;
  if (source.code === 'xsmn') return `${XSKT_BASE_URL}/xo-so-truc-tiep/mien-nam-xsmn.html`;
  if (source.code === 'xsmt') return `${XSKT_BASE_URL}/xo-so-truc-tiep/mien-trung-xsmt.html`;
  return null;
}

export async function fetchLotteryFromHtml(source: LotterySourceConfig, date?: string): Promise<LotteryResult | null> {
  const pageUrl = await discoverPageUrl(source);
  if (!pageUrl) return null;

  const url = buildDateUrl(pageUrl, date);
  const timeoutMs = numberFromEnv(['LOTTERY_HTML_TIMEOUT_MS', 'XSMB_HTML_TIMEOUT_MS', 'LOTTERY_FETCH_TIMEOUT_MS'], 6000);
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'xosomb.vn data fetcher/1.0'
    },
    next: { revalidate: Number(process.env.LOTTERY_REVALIDATE_SECONDS || process.env.XSMB_REVALIDATE_SECONDS || 60) }
  }, timeoutMs);

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Không lấy được HTML ${source.shortName}: ${response.status}`);

  const text = cleanPageText(await response.text());
  const slice = extractLikelyResultSlice(text, source, date);
  const resultDate = date || normalizeDateFromText(slice) || normalizeDateFromText(text) || undefined;

  return normalizeResultFromText(slice, source, {
    date: resultDate,
    sourceUrl: url,
    sourceName: process.env.LOTTERY_HTML_SOURCE_NAME || 'XSKT HTML',
    dataSource: 'html'
  });
}

async function getLivePageUrls(source: LotterySourceConfig) {
  const resultPageUrl = await discoverPageUrl(source).catch(() => null);
  return Array.from(new Set([configuredLivePageUrl(source), resultPageUrl].filter((url): url is string => Boolean(url))));
}

async function fetchLiveHtmlCandidate(
  source: LotterySourceConfig,
  date: string,
  pageUrl: string
): Promise<LotteryLiveResult | null> {
  const timeoutMs = numberFromEnv(
    ['LOTTERY_LIVE_HTML_TIMEOUT_MS', 'XSMB_LIVE_HTML_TIMEOUT_MS', 'LOTTERY_FETCH_TIMEOUT_MS'],
    6000
  );
  const liveBucketMs = numberFromEnv(['LOTTERY_LIVE_UPSTREAM_CACHE_MS', 'XSMB_LIVE_UPSTREAM_CACHE_MS'], 2000);
  const requestUrl = cacheBustUrl(pageUrl, '_live', liveBucketMs);
  const response = await fetchWithTimeout(
    requestUrl,
    {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'xosomb.vn data fetcher/1.1',
        'Cache-Control': 'no-cache, no-store, max-age=0',
        Pragma: 'no-cache'
      },
      cache: 'no-store',
      redirect: 'follow'
    },
    timeoutMs
  );

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Không lấy được HTML live ${source.shortName}: ${response.status}`);

  const text = cleanPageText(await response.text());
  const slice = extractLikelyResultSlice(text, source, date, true);
  if (!slice) return null;

  const detectedDate = normalizeDateFromText(slice);
  if (detectedDate && detectedDate !== date) return null;

  const result = normalizeLiveResultFromText(slice, source, {
    date,
    sourceUrl: pageUrl,
    sourceName: process.env.LOTTERY_LIVE_HTML_SOURCE_NAME || 'XSKT trực tiếp',
    dataSource: 'html'
  });

  return result?.date === date ? result : null;
}

async function fetchLiveLotteryFromHtmlUncached(
  source: LotterySourceConfig,
  date: string
): Promise<LotteryLiveResult | null> {
  // Trang HTML live luôn đại diện cho kỳ quay hiện tại. Không được gán
  // nội dung của hôm nay cho một ngày lịch sử khi API live được truy vấn theo date.
  if (date !== todayInVietnam()) return null;

  const pageUrls = await getLivePageUrls(source);
  if (!pageUrls.length) return null;

  // Trang trực tiếp có lúc chỉ render khung chờ, trong khi trang kết quả chính
  // đã có các giải mới. Đọc cả hai và chọn snapshot đầy đủ hơn.
  const candidates = await Promise.all(
    pageUrls.map((pageUrl) => fetchLiveHtmlCandidate(source, date, pageUrl).catch(() => null))
  );

  return candidates.reduce<LotteryLiveResult | null>(
    (best, candidate) => pickBetterLiveResult(best, candidate),
    null
  );
}

export async function fetchLiveLotteryFromHtml(
  source: LotterySourceConfig,
  date: string
): Promise<LotteryLiveResult | null> {
  const cacheMs = numberFromEnv(['LOTTERY_LIVE_UPSTREAM_CACHE_MS', 'XSMB_LIVE_UPSTREAM_CACHE_MS'], 2000);
  const cacheKey = `${source.code}:${date}`;
  const now = Date.now();
  const cached = liveHtmlCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.promise;

  const promise = fetchLiveLotteryFromHtmlUncached(source, date).catch((error) => {
    liveHtmlCache.delete(cacheKey);
    throw error;
  });
  liveHtmlCache.set(cacheKey, { expiresAt: now + cacheMs, promise });
  return promise;
}

function buildResultStartRegex(source: LotterySourceConfig) {
  const tokenPattern = sourceTokens(source)
    .map(escapeRegExp)
    .sort((a, b) => b.length - a.length)
    .join('|');

  return new RegExp(`(?:${tokenPattern})[^0-9]{0,35}(\\d{1,2}[\\/-]\\d{1,2}(?:[\\/-]\\d{2,4})?)`, 'gi');
}

export async function fetchRecentLotteryFromHtml(source: LotterySourceConfig, limit = 30): Promise<LotteryResult[]> {
  const pageUrl = await discoverPageUrl(source);
  if (!pageUrl) return [];

  const url = `${pageUrl.replace(/\/$/, '')}/30-ngay`;
  const timeoutMs = numberFromEnv(['LOTTERY_HTML_TIMEOUT_MS', 'XSMB_HTML_TIMEOUT_MS', 'LOTTERY_FETCH_TIMEOUT_MS'], 6000);
  const response = await fetchWithTimeout(url, {
    headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'xosomb.vn data fetcher/1.0' },
    next: { revalidate: Number(process.env.LOTTERY_REVALIDATE_SECONDS || process.env.XSMB_REVALIDATE_SECONDS || 60) }
  }, timeoutMs);

  if (!response.ok) return [];
  const text = cleanPageText(await response.text());

  const resultStartRegex = buildResultStartRegex(source);
  const starts: number[] = [];
  for (const match of text.matchAll(resultStartRegex)) starts.push(match.index || 0);

  const slices = starts.map((start, index) => text.slice(start, starts[index + 1] || text.length));
  const results = slices
    .map((slice) => normalizeResultFromText(slice, source, { sourceUrl: url, sourceName: 'XSKT HTML', dataSource: 'html' }))
    .filter((result): result is LotteryResult => Boolean(result && isCompleteLotteryResult(result)));

  return Array.from(new Map(results.map((result) => [result.date, result])).values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
