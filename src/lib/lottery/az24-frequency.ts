import { fetchWithTimeout, numberFromEnv } from '@/lib/fetch-utils';
import {
  ALL_TWO_DIGITS,
  dateColumnFromYyyyMmDd,
  type FrequencyBuildOptions,
  type FrequencyCell,
  type FrequencyRow,
  type FrequencyTableData
} from './frequency';

const AZ24_FREQUENCY_URL = 'https://az24.vn/thong-ke-tan-suat-lo-to-mien-bac.html';

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
}

function getCookieHeader(response: Response) {
  const raw = response.headers.get('set-cookie');
  if (!raw) return '';

  return raw
    .split(/,\s*(?=[^;,\s]+=)/g)
    .map((cookie) => cookie.split(';')[0])
    .filter(Boolean)
    .join('; ');
}

function csrfFromHtml(html: string) {
  return html.match(/name=["']csrffrontend["'][^>]*value=["']([^"']+)["']/i)?.[1] || '';
}

function normalizeDateFromParts(day?: string, month?: string, year?: string) {
  if (!day || !month || !year) return null;
  const fullYear = year.length === 2 ? `20${year}` : year;
  const normalized = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function parseHeaderColumns(html: string) {
  const headerMatch = html.match(/<table\b[^>]*class=["'][^"']*sticky-header[^"']*["'][^>]*>[\s\S]*?<tr\b[^>]*>([\s\S]*?)<\/tr>/i);
  const headerHtml = headerMatch?.[1] || '';
  const ths = Array.from(headerHtml.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)).map((match) => match[1]);

  return ths.slice(1, -1).flatMap((th) => {
    const parts = stripTags(th).match(/\d{1,4}/g) || [];
    const date = normalizeDateFromParts(parts[0], parts[1], parts[2]);
    return date ? [dateColumnFromYyyyMmDd(date)] : [];
  });
}

function parseCell(attributes: string, html: string, digit: string): FrequencyCell {
  const text = stripTags(html);
  const count = Number(text.match(/\d+/)?.[0] || 0);
  const isSpecial = count > 0 && (/ĐB|DB|đặc biệt|c2/i.test(decodeHtml(`${attributes} ${html}`)) || /<span\b/i.test(html));

  return {
    count,
    isSpecial,
    title: count > 0 ? `Lô ${digit} ${count} nháy${isSpecial ? ' - giải đặc biệt' : ''}` : undefined
  };
}

function parseRows(html: string, selectedDigits: string[], columnCount: number): FrequencyRow[] {
  const selectedSet = new Set(selectedDigits.length ? selectedDigits : ALL_TWO_DIGITS);
  const rows: FrequencyRow[] = [];
  const rowRegex = /<tr\b(?=[^>]*class=["'][^"']*tk-row[^"']*["'])(?=[^>]*data-value=["'](\d{2})["'])[^>]*>([\s\S]*?)<\/tr>/gi;

  for (const rowMatch of html.matchAll(rowRegex)) {
    const digit = rowMatch[1];
    if (!selectedSet.has(digit)) continue;

    const cellsHtml = Array.from(rowMatch[2].matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi));
    if (cellsHtml.length < 2) continue;

    const valueCells = cellsHtml.slice(1, 1 + columnCount).map((cell) => parseCell(cell[1], cell[2], digit));
    const totalCell = cellsHtml[cellsHtml.length - 1]?.[2] || '';
    const parsedTotal = Number(stripTags(totalCell).match(/\d+/)?.[0] || 0);

    rows.push({
      digit,
      cells: valueCells,
      total: Number.isFinite(parsedTotal) ? parsedTotal : valueCells.reduce((sum, cell) => sum + cell.count, 0)
    });
  }

  return rows.sort((a, b) => Number(a.digit) - Number(b.digit));
}

function parseTitle(html: string, fallbackTitle: string) {
  const titleMatch = html.match(/<h2\b[^>]*class=["'][^"']*tit-mien[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i)
    || html.match(/<h2\b[^>]*>([\s\S]*?thống kê tần suất[\s\S]*?)<\/h2>/i);

  return titleMatch ? stripTags(titleMatch[1]) : fallbackTitle;
}

export function parseAz24FrequencyHtml(html: string, options: FrequencyBuildOptions): FrequencyTableData | null {
  const columns = parseHeaderColumns(html);
  if (!columns.length) return null;

  const rows = parseRows(html, options.selectedDigits, columns.length);
  const fromDate = columns.at(-1)?.label;
  const toDate = columns[0]?.label;
  const fallbackTitle = `Kết quả thống kê tần suất loto Miền Bắc${fromDate && toDate ? ` từ ${fromDate} đến ${toDate}` : ''}`;

  return {
    title: parseTitle(html, fallbackTitle),
    columns,
    rows,
    fromDate,
    toDate,
    source: 'az24-html',
    resultCount: columns.length,
    note: rows.length ? undefined : 'Không có bộ số nào được chọn để hiển thị.'
  };
}

function buildPostBody(csrf: string, options: FrequencyBuildOptions) {
  const body = new URLSearchParams();
  if (csrf) body.set('csrffrontend', csrf);
  body.set('StatisticForm[provinceId]', '1');
  body.set('StatisticForm[numOfDay]', String(options.numOfDay));
  body.set('StatisticForm[type]', options.statType);
  body.set('rb-btn', '1');

  for (const digit of options.selectedDigits.length ? options.selectedDigits : ALL_TWO_DIGITS) {
    body.append('boso[]', digit);
  }

  return body;
}

export async function fetchAz24FrequencyTable(options: FrequencyBuildOptions): Promise<FrequencyTableData | null> {
  if (process.env.AZ24_FREQUENCY_ENABLED === 'false') return null;
  // Không gọi nguồn ngoài trong lúc next build để tránh build bị treo nếu AZ24/DNS chậm.
  // Khi chạy runtime trên server, trang vẫn gọi AZ24 bình thường.
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.npm_lifecycle_event === 'build') return null;

  const timeoutMs = numberFromEnv(['AZ24_FREQUENCY_TIMEOUT_MS', 'LOTTERY_FETCH_TIMEOUT_MS'], 8000);
  const commonHeaders = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
    'User-Agent': 'Mozilla/5.0 (compatible; xosomb.vn statistics fetcher/1.0)'
  };

  const getResponse = await fetchWithTimeout(
    AZ24_FREQUENCY_URL,
    {
      headers: commonHeaders,
      next: { revalidate: Number(process.env.AZ24_FREQUENCY_REVALIDATE_SECONDS || 300) }
    },
    timeoutMs
  );

  if (!getResponse.ok) return null;
  const getHtml = await getResponse.text();
  const csrf = csrfFromHtml(getHtml);
  const cookie = getCookieHeader(getResponse);

  const postResponse = await fetchWithTimeout(
    AZ24_FREQUENCY_URL,
    {
      method: 'POST',
      headers: {
        ...commonHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://az24.vn',
        Referer: AZ24_FREQUENCY_URL,
        ...(cookie ? { Cookie: cookie } : {})
      },
      body: buildPostBody(csrf, options),
      cache: 'no-store',
      redirect: 'follow'
    },
    timeoutMs
  );

  if (!postResponse.ok) return parseAz24FrequencyHtml(getHtml, options);
  return parseAz24FrequencyHtml(await postResponse.text(), options) || parseAz24FrequencyHtml(getHtml, options);
}
