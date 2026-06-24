import type { DigitStat, LotteryRegion, LotteryResult } from './types';

export function todayInVietnam(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
}

// Lấy current time ở Vietnam timezone - trả về ISO string với offset +07:00
export function getCurrentTimeInVietnam() {
  const now = new Date();
  // Get Vietnam time components
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const vn: Record<string, number> = {};
  parts.forEach(p => {
    if (p.type !== 'literal') vn[p.type] = parseInt(p.value, 10);
  });

  const ms = String(now.getMilliseconds()).padStart(3, '0');
  // Return ISO string with Vietnam timezone offset (+07:00)
  return `${vn.year}-${String(vn.month).padStart(2, '0')}-${String(vn.day).padStart(2, '0')}T${String(vn.hour).padStart(2, '0')}:${String(vn.minute).padStart(2, '0')}:${String(vn.second).padStart(2, '0')}.${ms}+07:00`;
}

export function parseYyyyMmDd(dateValue?: string | null): Date | null {
  if (!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return null;

  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function isYyyyMmDd(dateValue: string) {
  return Boolean(parseYyyyMmDd(dateValue));
}

export function isFutureDate(dateValue: string) {
  return isYyyyMmDd(dateValue) && dateValue > todayInVietnam();
}


function vietnamDatePartFromTimestamp(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function formatVietnamDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const valueByType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${valueByType.hour}:${valueByType.minute}:${valueByType.second} ${valueByType.day}/${valueByType.month}/${valueByType.year}`;
}

export function expectedResultUpdatedAt(dateValue: string, region?: LotteryRegion) {
  if (!isYyyyMmDd(dateValue)) return null;

  const completedTimeByRegion: Record<LotteryRegion, string> = {
    north: '18:45:00',
    south: '16:45:00',
    central: '17:45:00',
    vietlott: '18:45:00',
    computer: '18:45:00'
  };

  return `${dateValue}T${completedTimeByRegion[region || 'north']}+07:00`;
}


export function getReliableResultUpdatedAt(value: string | undefined, dateValue: string, region?: LotteryRegion) {
  const sourceDate = vietnamDatePartFromTimestamp(value);
  if (value && sourceDate === dateValue) return value;

  return expectedResultUpdatedAt(dateValue, region) || value || getCurrentTimeInVietnam();
}

export function getResultDisplayUpdatedAt(
  result: Pick<LotteryResult, 'date' | 'region' | 'updatedAt' | 'fetchedAt'>
) {
  const updatedAtDate = vietnamDatePartFromTimestamp(result.updatedAt);

  // Với kết quả đã đầy đủ, không hiển thị thời điểm server/cache kiểm tra lại
  // nếu thời điểm đó lệch sang ngày hôm sau. Điều này tránh dòng kiểu:
  // "Kết quả đầy đủ ngày 23/06/2026 · Dữ liệu kiểm tra lúc ... 24/06/2026".
  if (updatedAtDate === result.date) return result.updatedAt;

  return expectedResultUpdatedAt(result.date, result.region) || result.updatedAt || result.fetchedAt || null;
}

export function toVietnameseDate(dateValue: string) {
  const date = parseYyyyMmDd(dateValue);
  if (!date) return dateValue;

  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh'
  }).format(date);
}

export function yyyyMmDdToXsktPathDate(dateValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number);
  return `${day}-${month}-${year}`;
}

export function ddMmYyyyFromDate(dateValue: string) {
  const [year, month, day] = dateValue.split('-');
  return `${day}/${month}/${year}`;
}

export function dateTextForSeo(dateValue: string) {
  return isYyyyMmDd(dateValue) ? `ngày ${ddMmYyyyFromDate(dateValue)}` : `ngày ${dateValue}`;
}

export function normalizeDateFromText(value: string): string | null {
  const match = value.match(/(?:ngày|ngay)?\s*(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?/i);
  if (!match) return null;

  const [, first, second, rawYear] = match;
  const year = rawYear ? (rawYear.length === 2 ? `20${rawYear}` : rawYear) : String(new Date().getFullYear());

  // Xác định day/month: nếu first > 12 thì first là ngày, ngược lại cần kiểm tra context
  const firstNum = parseInt(first, 10);
  const secondNum = parseInt(second, 10);

  let day: string, month: string;
  if (firstNum > 12) {
    // first chắc chắn là ngày
    day = first;
    month = second;
  } else if (secondNum > 12) {
    // second chắc chắn là tháng (ko valid)
    return null;
  } else {
    // Cả hai đều có thể là ngày hoặc tháng - assume format là DD/MM
    day = first;
    month = second;
  }

  // Validate
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) return null;

  const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return isYyyyMmDd(normalized) ? normalized : null;
}

export function normalizeDateFromPubDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function getAllNumbers(result: LotteryResult) {
  return result.prizes.flatMap((row) => row.numbers);
}

export function getLastTwoDigits(numberValue: string) {
  return numberValue.slice(-2);
}

function formatPairCounts(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);

  return Array.from(counts.entries())
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([value, count]) => (count > 1 ? `${value}(${count})` : value));
}

export function buildHeadTailTable(result: LotteryResult) {
  const pairs = getAllNumbers(result).map(getLastTwoDigits);

  return Array.from({ length: 10 }, (_, index) => {
    const digit = String(index);
    return {
      digit,
      headValues: formatPairCounts(pairs.filter((pair) => pair.startsWith(digit))),
      tailValues: formatPairCounts(pairs.filter((pair) => pair.endsWith(digit)))
    };
  });
}

export function digitStats(results: LotteryResult[]): DigitStat[] {
  const counts = new Map<string, number>();

  for (const result of results) {
    for (const numberValue of getAllNumbers(result)) {
      const pair = getLastTwoDigits(numberValue);
      counts.set(pair, (counts.get(pair) || 0) + 1);
    }
  }

  return Array.from({ length: 100 }, (_, index) => {
    const digit = index.toString().padStart(2, '0');
    return { digit, count: counts.get(digit) || 0 };
  }).sort((a, b) => b.count - a.count || a.digit.localeCompare(b.digit));
}
