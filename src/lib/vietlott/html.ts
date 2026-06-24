import { buildVietlottRecentUrl, buildVietlottUrl } from './catalog';
import { cleanHtmlText } from './format';
import { normalizeVietlottText } from './normalize';
import type { VietlottProductConfig, VietlottResult } from './types';
import { fetchWithTimeout, numberFromEnv } from '@/lib/fetch-utils';

function resultStartRegex(product: VietlottProductConfig) {
  const names = [product.shortName, product.name, ...product.aliases]
    .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|');

  return new RegExp(`(?:${names}|Kỳ\\s*mở thưởng|Kỳ\\s*MT|QSMT\\s*kỳ)[^0-9]{0,60}(\\d{1,2}[\\/-]\\d{1,2}(?:[\\/-]\\d{2,4})?)`, 'gi');
}

function escapeRegexText(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sliceMainResult(text: string, product?: VietlottProductConfig) {
  // Ưu tiên cắt quanh khối kết quả thật, vì vài trang ngày lẻ của XSKT
  // vẫn hiển thị tiêu đề ngày được hỏi nhưng bên dưới lại gợi ý một kỳ khác.
  // Cắt quanh "Kỳ mở thưởng/Kỳ MT" giúp parser không gắn nhầm số của ngày khác
  // vào URL đang xem.
  const drawIndex = text.search(/Kỳ\s*(?:mở thưởng|quay thưởng|MT|vé)?|QSMT\s*kỳ/i);
  if (drawIndex >= 0) {
    const windowStart = Math.max(0, drawIndex - 260);
    const beforeDraw = text.slice(windowStart, drawIndex);
    const headingDateMatches = Array.from(beforeDraw.matchAll(/(?:ngày|ngay)?\s*\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?/gi));
    const lastDate = headingDateMatches.at(-1);
    const start = lastDate?.index !== undefined ? windowStart + lastDate.index : windowStart;
    const slice = text.slice(start);
    const stopTokens = ['Ghi chú', 'Tiện ích hay', 'Tin tức', 'Xem thêm kết quả', 'Hiện thêm kết quả', 'VỀ XỔ SỐ', 'Về Xổ số', 'Cách chơi'];
    let end = slice.length;
    for (const token of stopTokens) {
      const index = slice.search(new RegExp(escapeRegexText(token), 'i'));
      if (index > 100 && index < end) end = index;
    }
    return slice.slice(0, end);
  }

  let start = 0;

  if (product) {
    const names = [product.name, product.shortName, ...product.aliases]
      .map(escapeRegexText)
      .sort((a, b) => b.length - a.length)
      .join('|');
    const productHeading = new RegExp(`(?:${names})[^\n]{0,140}\\bngày\\s*\\d{1,2}[\\/-]\\d{1,2}`, 'i');
    const headingMatch = text.match(productHeading);
    if (headingMatch?.index !== undefined) start = headingMatch.index;
  }

  if (!start) {
    const starts = [
      text.search(/Kỳ\s*(?:mở thưởng|quay thưởng|MT|vé)/i),
      text.search(/QSMT\s*kỳ/i),
      text.search(/Jackpot/i),
      text.search(/Giải\s*ĐB|Đặc biệt/i),
      text.search(/\bKết quả\b/i)
    ].filter((index) => index >= 0);
    start = starts.length ? Math.min(...starts) : 0;
  }

  const slice = text.slice(start);
  const stopTokens = ['Ghi chú', 'Tiện ích hay', 'Tin tức', 'Xem thêm kết quả', 'Hiện thêm kết quả', 'VỀ XỔ SỐ', 'Về Xổ số', 'Cách chơi'];
  let end = slice.length;
  for (const token of stopTokens) {
    const index = slice.search(new RegExp(escapeRegexText(token), 'i'));
    if (index > 100 && index < end) end = index;
  }

  return slice.slice(0, end);
}

export async function fetchVietlottFromHtml(product: VietlottProductConfig, date?: string): Promise<VietlottResult | null> {
  const url = buildVietlottUrl(product, date);
  const timeoutMs = numberFromEnv(['VIETLOTT_HTML_TIMEOUT_MS', 'LOTTERY_HTML_TIMEOUT_MS', 'LOTTERY_FETCH_TIMEOUT_MS'], 6000);
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'xosomb.vn vietlott data fetcher/1.0'
    },
    next: { revalidate: Number(process.env.VIETLOTT_REVALIDATE_SECONDS || process.env.LOTTERY_REVALIDATE_SECONDS || 60) }
  }, timeoutMs);

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Không lấy được HTML ${product.shortName}: ${response.status}`);

  const text = cleanHtmlText(await response.text());
  const slice = sliceMainResult(text, product);

  return normalizeVietlottText(slice, product, {
    date,
    sourceName: process.env.VIETLOTT_HTML_SOURCE_NAME || 'XSKT HTML',
    sourceUrl: url,
    dataSource: 'html'
  });
}

export async function fetchRecentVietlottFromHtml(product: VietlottProductConfig, limit = 30): Promise<VietlottResult[]> {
  const url = buildVietlottRecentUrl(product);
  const timeoutMs = numberFromEnv(['VIETLOTT_HTML_TIMEOUT_MS', 'LOTTERY_HTML_TIMEOUT_MS', 'LOTTERY_FETCH_TIMEOUT_MS'], 6000);
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'xosomb.vn vietlott data fetcher/1.0'
    },
    next: { revalidate: Number(process.env.VIETLOTT_REVALIDATE_SECONDS || process.env.LOTTERY_REVALIDATE_SECONDS || 60) }
  }, timeoutMs);

  if (!response.ok) return [];
  const text = cleanHtmlText(await response.text());
  const regex = resultStartRegex(product);
  const starts: number[] = [];
  for (const match of text.matchAll(regex)) starts.push(match.index || 0);

  if (!starts.length) {
    const single = normalizeVietlottText(sliceMainResult(text, product), product, {
      sourceName: process.env.VIETLOTT_HTML_SOURCE_NAME || 'XSKT HTML',
      sourceUrl: url,
      dataSource: 'html'
    });
    return single ? [single] : [];
  }

  const results = starts
    .map((start, index) => text.slice(start, starts[index + 1] || text.length))
    .map((slice) =>
      normalizeVietlottText(slice, product, {
        sourceName: process.env.VIETLOTT_HTML_SOURCE_NAME || 'XSKT HTML',
        sourceUrl: url,
        dataSource: 'html'
      })
    )
    .filter((result): result is VietlottResult => Boolean(result));

  return Array.from(new Map(results.map((result) => [result.date, result])).values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
