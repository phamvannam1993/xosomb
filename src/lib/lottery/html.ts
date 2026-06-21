import type { LotteryResult, LotterySourceConfig } from './types';
import { isCompleteLotteryResult, normalizeResultFromText } from './normalize';
import { ddMmYyyyFromDate, normalizeDateFromText, yyyyMmDdToXsktPathDate } from './format';
import { discoverPageUrl } from './discovery';
import { fetchWithTimeout, numberFromEnv } from '@/lib/fetch-utils';

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

function extractLikelyResultSlice(text: string, source: LotterySourceConfig, date?: string) {
  const tokens = sourceTokens(source);
  const dates = dateTextVariants(date);
  const candidates: string[] = [];

  for (const token of tokens) {
    candidates.push(token);
    for (const dateText of dates) {
      candidates.push(`${token} ${dateText}`);
      candidates.push(`${token} ngày ${dateText}`);
      candidates.push(`${token} ngay ${dateText}`);
    }
  }

  // Backward-compatible candidate cũ.
  if (date) {
    const dateShort = ddMmYyyyFromDate(date).replace(/\/0/g, '/');
    candidates.push(`${source.shortName} ${dateShort}`);
  }

  let start = -1;
  for (const candidate of candidates.filter(Boolean)) {
    start = text.toLowerCase().indexOf(candidate.toLowerCase());
    if (start >= 0) break;
  }

  if (start < 0) start = 0;
  const firstPrizeAfterStart = text.slice(start).search(/\b(?:ĐB|DB|G\.?\s*[1-8])\b/iu);
  if (firstPrizeAfterStart >= 0) start += firstPrizeAfterStart;

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
