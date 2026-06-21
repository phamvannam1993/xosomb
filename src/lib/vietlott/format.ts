export function cleanHtmlText(html: string) {
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

export function parseYyyyMmDd(value?: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split('-').map(Number);
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

export function isYyyyMmDd(value?: string | null) {
  return Boolean(parseYyyyMmDd(value));
}

export function todayInVietnam() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export function isFutureDate(value: string) {
  return isYyyyMmDd(value) && value > todayInVietnam();
}

export function normalizeDateFromText(text: string): string | null {
  const match = text.match(/(?:ngày|ngay)?\s*(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/i);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = match[3] ? Number(match[3]) : new Date().getFullYear();
  if (year < 100) year += 2000;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  const normalized = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return isYyyyMmDd(normalized) ? normalized : null;
}

export function toVietnameseDate(date: string) {
  const d = parseYyyyMmDd(date);
  if (!d) return date;

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
}

export function ddMmYyyyFromDate(dateValue: string) {
  const [year, month, day] = dateValue.split('-');
  return `${day}/${month}/${year}`;
}

export function dateTextForSeo(dateValue: string) {
  return isYyyyMmDd(dateValue) ? `ngày ${ddMmYyyyFromDate(dateValue)}` : `ngày ${dateValue}`;
}

export function extractMoneyLikeValues(text: string) {
  return Array.from(text.matchAll(/\b\d{1,3}(?:[,.]\d{3})+(?:\s*(?:đ|đồng|vnđ|VNĐ))?\b/g)).map((m) => m[0]);
}

export function compactMoney(value?: string) {
  return value?.replace(/\s+/g, ' ').trim() || undefined;
}
