import type { VietlottProductConfig, VietlottProductId, VietlottPrizeRow, VietlottResult } from './types';
import { compactMoney, extractMoneyLikeValues, isFutureDate, isYyyyMmDd, normalizeDateFromText } from './format';

const rowLabels = [
  'Jackpot 1',
  'Jackpot 2',
  'Jpot2',
  'JP2',
  'Jackpot',
  'J.pot',
  'Giải ĐB',
  'G.ĐB',
  'Đặc biệt',
  'G. phụ ĐB',
  'G phụ ĐB',
  'Phụ ĐB',
  'Giải nhất',
  'Giải nhì',
  'Giải ba',
  'Giải tư (KK)',
  'Giải tư',
  'Giải năm',
  'Giải sáu',
  'Giải bảy',
  'G.1',
  'G1',
  'G.2',
  'G2',
  'G.3',
  'G3'
];


const compactPrizePattern = String.raw`(?:1\s*tỷ|2\s*tỷ|400\s*tr|40\s*tr|30\s*tr|10\s*tr|5\s*tr|4\s*tr|1\s*tr|350\s*k|300\s*k|210\s*k|150\s*k|100\s*k|50\s*k|40\s*k|30\s*k)`;
const compactPrizeRegex = new RegExp(`(^|[^0-9A-Za-zÀ-ỹ])(${compactPrizePattern})(?=[^0-9A-Za-zÀ-ỹ]|$)`, 'i');
const compactPrizeGlobalRegex = new RegExp(`(^|[^0-9A-Za-zÀ-ỹ])(${compactPrizePattern})\\s*:?`, 'gi');

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function labelPattern() {
  return rowLabels
    .map(escapeRegex)
    .sort((a, b) => b.length - a.length)
    .join('|');
}

function splitPrizeSegments(text: string) {
  const regex = new RegExp(`(${labelPattern()})`, 'gi');
  const matches = Array.from(text.matchAll(regex)).filter((match) => {
    const index = match.index || 0;
    const before = text.slice(Math.max(0, index - 12), index);
    return !/của\s+$/i.test(before);
  });

  return matches.map((match, index) => {
    const start = match.index || 0;
    const label = match[1].trim();
    const next = matches[index + 1]?.index || text.length;
    return { label, segment: text.slice(start + label.length, next).trim() };
  });
}

function normalizeLabel(label: string) {
  const raw = label.toLowerCase().replace(/\s+/g, ' ').trim();

  if (raw.includes('jackpot 1')) return 'Jackpot 1';
  if (raw.includes('jackpot 2') || raw.includes('jpot2') || raw === 'jp2') return 'Jackpot 2';
  if (raw.includes('jackpot') || raw.includes('j.pot')) return 'Jackpot';
  if (raw.includes('phụ')) return 'Phụ ĐB';
  if (raw.includes('đb') || raw.includes('đặc biệt')) return 'Đặc biệt';

  if (/^g\.?\s*1$/.test(raw) || raw.includes('nhất')) return 'Giải nhất';
  if (/^g\.?\s*2$/.test(raw) || raw.includes('nhì')) return 'Giải nhì';
  if (/^g\.?\s*3$/.test(raw) || raw.includes('ba')) return 'Giải ba';
  if (raw.includes('tư')) return 'Giải tư';
  if (raw.includes('năm')) return 'Giải năm';
  if (raw.includes('sáu')) return 'Giải sáu';
  if (raw.includes('bảy')) return 'Giải bảy';

  return label;
}

function isBlockedDigitNeighbor(char?: string) {
  return Boolean(char && /[0-9A-Za-zÀ-ỹ/.,:]/.test(char));
}

function twoDigitNumberTokens(segment: string) {
  return Array.from(segment.matchAll(/\d{2}/g))
    .map((match) => ({ value: match[0], index: match.index || 0 }))
    .filter(({ index }) => {
      const previous = segment[index - 1];
      const next = segment[index + 2];
      return !isBlockedDigitNeighbor(previous) && !isBlockedDigitNeighbor(next);
    });
}

function twoDigitNumbers(segment: string) {
  return twoDigitNumberTokens(segment).map((match) => match.value);
}

function winnerCandidates(segment: string) {
  return Array.from(segment.matchAll(/(?<![\d,.])\d{1,6}(?![\d,.])/g)).map((match) => match[0]);
}

function amountFromSegment(segment: string) {
  const compact = segment.match(compactPrizeRegex)?.[2];
  if (compact) return compactMoney(compact);

  const money = extractMoneyLikeValues(segment);
  if (money.length) return compactMoney(money[money.length - 1]);

  return undefined;
}

function stripPrizeValue(segment: string, prizeValue?: string) {
  let cleaned = segment;
  if (prizeValue) cleaned = cleaned.replace(prizeValue, ' ');
  cleaned = cleaned.replace(compactPrizeGlobalRegex, ' ');
  cleaned = cleaned.replace(/\b\d{1,3}(?:[,.]\d{3})+\b/g, ' ');
  return cleaned;
}
function winnersFromSegment(segment: string, amount?: string) {
  const withoutPrize = amount ? segment.replace(amount, ' ') : segment;
  const groupedCounts = extractMoneyLikeValues(withoutPrize);
  if (groupedCounts.length) return groupedCounts[groupedCounts.length - 1];

  const cleaned = stripPrizeValue(segment, amount);
  const candidates = winnerCandidates(cleaned);
  return candidates.length ? candidates[candidates.length - 1] : undefined;
}

function parseDrawId(text: string) {
  return text.match(/(?:Kỳ\s*(?:mở thưởng|quay thưởng|MT|vé)?|QSMT\s*kỳ)\s*#?\s*(\d{3,6})/i)?.[1];
}

function takeAfterResultKeyword(text: string) {
  const match = text.match(/\bKết quả\b([\s\S]{0,260})/i);
  return match?.[1] || text;
}

function takeDrawNumbersForMegaPower(text: string, product: VietlottProductId) {
  const startCandidates = [
    text.search(/\bKết quả\b/i),
    text.search(/(?:Bộ số|Dãy số|Dãy số trúng thưởng|Kết quả quay số)/i),
    text.search(/Kỳ\s*(?:quay thưởng|mở thưởng|MT|vé)/i),
    text.search(/QSMT\s*kỳ/i)
  ].filter((index) => index >= 0);

  const resultStart = startCandidates.length ? Math.min(...startCandidates) : 0;
  const statsStart = text.search(/\bThống kê trúng giải\b/i);
  const drawSlice = text.slice(
    resultStart,
    statsStart > resultStart ? statsStart : Math.min(text.length, resultStart + 900)
  );

  const numberLimit = product === 'power-655' ? 55 : 45;
  const candidateSlice = takeAfterResultKeyword(drawSlice);
  const validTwoDigits = twoDigitNumbers(candidateSlice)
    .filter((number) => Number(number) >= 1 && Number(number) <= numberLimit);

  const main: string[] = [];
  for (const number of validTwoDigits) {
    if (!main.includes(number)) main.push(number);
    if (main.length === 6) break;
  }

  let bonus: string | undefined;
  if (product === 'power-655') {
    const jp2 = drawSlice.match(/(?:Số\s*JP2|JP2|số phụ|bonus)[^0-9]{0,20}(\d{2})/i)?.[1];
    const lastMainIndex = validTwoDigits.findIndex((number, index) => index >= 5 && number === main[main.length - 1]);
    bonus = jp2 || validTwoDigits.slice(lastMainIndex + 1).find((number) => Number(number) >= 1 && Number(number) <= 55 && !main.includes(number));
  }

  return { main, bonus };
}

function parseMegaPowerRows(text: string, product: VietlottProductId): VietlottPrizeRow[] {
  const statsStart = text.search(/\bThống kê trúng giải\b/i);
  const statsSlice = statsStart >= 0 ? text.slice(statsStart) : text;
  const segments = splitPrizeSegments(statsSlice);
  const allowedLabels = product === 'power-655'
    ? ['Jackpot 1', 'Jackpot 2', 'Jackpot', 'Giải nhất', 'Giải nhì', 'Giải ba']
    : ['Jackpot', 'Giải nhất', 'Giải nhì', 'Giải ba'];

  const rows = segments
    .map(({ label, segment }) => {
      const normalizedLabel = normalizeLabel(label);
      const prizeValue = amountFromSegment(segment);
      const finalLabel = product === 'power-655' && normalizedLabel === 'Jackpot' ? 'Jackpot 1' : normalizedLabel;
      return {
        label: finalLabel,
        winners: winnersFromSegment(segment, prizeValue),
        prizeValue
      } satisfies VietlottPrizeRow;
    })
    .filter((row) => allowedLabels.includes(row.label));

  return preferBetterRows(rows, allowedLabels);
}

function threeDigitLikeNumbers(segment: string, prizeValue: string | undefined, label: string, product: VietlottProductId) {
  if (product === 'max-3d-pro' && !['Đặc biệt', 'Phụ ĐB', 'Giải nhất', 'Giải nhì', 'Giải ba'].includes(label)) return [];
  const cleaned = stripPrizeValue(segment, prizeValue)
    .replace(/\b(?:Max\s*3D\+?|Trùng khớp|bộ số|bất kỳ|trong toàn bộ|của giải|Giải|Đặc biệt|ĐB)\b/gi, ' ');

  const tokens = Array.from(cleaned.matchAll(/(?<![\dA-Za-zÀ-ỹ,.])\d{1,3}(?![\dA-Za-zÀ-ỹ,.])/g)).map((match) => match[0]);
  if (!tokens.length) return [];
  if (tokens.length === 1 && tokens[0].length < 3) return [];

  const normalized = tokens.map((token) => token.padStart(3, '0'));

  while (normalized.length > 1) {
    const originalLast = tokens[normalized.length - 1];
    const previousHasFullLength = tokens.slice(0, normalized.length - 1).some((token) => token.length === 3);
    if (originalLast.length < 3 && previousHasFullLength) {
      normalized.pop();
      tokens.pop();
      continue;
    }
    break;
  }

  return unique(normalized);
}

function rowScore(row: VietlottPrizeRow) {
  return (row.numbers?.length || 0) * 10 + (row.prizeValue ? 2 : 0) + (row.winners ? 1 : 0) + (row.matchText ? 1 : 0);
}

function preferBetterRows(rows: VietlottPrizeRow[], desiredOrder: string[]) {
  const byLabel = new Map<string, VietlottPrizeRow>();

  for (const row of rows) {
    const current = byLabel.get(row.label);
    if (!current || rowScore(row) > rowScore(current)) byLabel.set(row.label, row);
  }

  return desiredOrder
    .map((label) => byLabel.get(label))
    .filter((row): row is VietlottPrizeRow => Boolean(row));
}

function parseMaxRows(text: string, product: VietlottProductId) {
  const segments = splitPrizeSegments(text);
  const rows = segments.map(({ label, segment }) => {
    const normalizedLabel = normalizeLabel(label);
    const prizeValue = amountFromSegment(segment);
    const numbers = threeDigitLikeNumbers(segment, prizeValue, normalizedLabel, product);
    const winners = product === 'max-3d-pro' || numbers.length === 0 ? winnersFromSegment(segment, prizeValue) : undefined;
    return {
      label: normalizedLabel,
      numbers,
      winners,
      prizeValue,
      matchText: numbers.length ? undefined : segment.slice(0, 160).trim() || undefined
    } satisfies VietlottPrizeRow;
  });

  const wanted = product === 'max-3d-pro'
    ? ['Đặc biệt', 'Phụ ĐB', 'Giải nhất', 'Giải nhì', 'Giải ba', 'Giải tư', 'Giải năm', 'Giải sáu']
    : ['Đặc biệt', 'Giải nhất', 'Giải nhì', 'Giải ba', 'Giải tư', 'Giải năm', 'Giải sáu', 'Giải bảy'];

  return preferBetterRows(rows.filter((row) => wanted.includes(row.label)), wanted)
    .filter((row) => row.numbers?.length || row.prizeValue || row.winners || row.matchText);
}

function mainNumbersFromRows(rows: VietlottPrizeRow[]) {
  const special = rows.find((row) => row.label === 'Đặc biệt' && row.numbers?.length);
  if (special?.numbers?.length) return special.numbers;

  const firstWithNumbers = rows.find((row) => row.numbers?.length);
  return firstWithNumbers?.numbers || [];
}

function isValidVietlottResult(result: VietlottResult | null | undefined): result is VietlottResult {
  if (!result || !isYyyyMmDd(result.date) || isFutureDate(result.date) || result.numbers.length === 0 || result.rows.length === 0) return false;

  if (result.product === 'mega-645' || result.product === 'power-655') {
    const limit = result.product === 'power-655' ? 55 : 45;
    const hasSixMainNumbers = result.numbers.length === 6;
    const hasUniqueMainNumbers = new Set(result.numbers).size === result.numbers.length;
    const numbersInRange = result.numbers.every((number) => Number(number) >= 1 && Number(number) <= limit);
    const hasUsefulRows = result.rows.length >= 3;
    return hasSixMainNumbers && hasUniqueMainNumbers && numbersInRange && hasUsefulRows;
  }

  const hasUsefulRows = result.rows.some((row) => row.numbers?.length);
  return hasUsefulRows;
}

export function normalizeVietlottText(
  text: string,
  product: VietlottProductConfig,
  options: {
    date?: string;
    sourceName: string;
    sourceUrl?: string;
    updatedAt?: string;
    dataSource?: VietlottResult['dataSource'];
  }
): VietlottResult | null {
  const detectedDate = normalizeDateFromText(text);
  if (options.date && detectedDate && detectedDate !== options.date) return null;

  const date = options.date || detectedDate;
  if (!date) return null;

  let numbers: string[] = [];
  let bonusNumber: string | undefined;
  let rows: VietlottPrizeRow[] = [];

  if (product.id === 'mega-645' || product.id === 'power-655') {
    const parsed = takeDrawNumbersForMegaPower(text, product.id);
    numbers = parsed.main;
    bonusNumber = parsed.bonus;
    rows = parseMegaPowerRows(text, product.id);
  } else {
    rows = parseMaxRows(text, product.id);
    numbers = mainNumbersFromRows(rows);
  }

  const result: VietlottResult = {
    product: product.id,
    productName: product.name,
    shortName: product.shortName,
    date,
    drawId: parseDrawId(text),
    numbers,
    bonusNumber,
    rows,
    sourceName: options.sourceName,
    sourceUrl: options.sourceUrl,
    updatedAt: options.updatedAt || new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    dataSource: options.dataSource
  };

  return isValidVietlottResult(result) ? result : null;
}

export function normalizeVietlottApiResult(payload: unknown, product: VietlottProductConfig): VietlottResult | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Partial<VietlottResult> & { data?: Partial<VietlottResult> };
  const raw = data.data || data;

  if (!raw.date || !Array.isArray(raw.numbers)) return null;

  const result: VietlottResult = {
    product: product.id,
    productName: product.name,
    shortName: product.shortName,
    date: raw.date,
    drawId: raw.drawId,
    numbers: raw.numbers.map(String),
    bonusNumber: raw.bonusNumber,
    rows: Array.isArray(raw.rows) ? raw.rows : [],
    sourceName: raw.sourceName || 'API',
    sourceUrl: raw.sourceUrl,
    updatedAt: raw.updatedAt || new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    dataSource: 'api'
  };

  return isValidVietlottResult(result) ? result : null;
}

export { isValidVietlottResult };
