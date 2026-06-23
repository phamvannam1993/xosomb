import type { LotteryLiveResult, LotteryResult, LotterySourceConfig, PrizeRow, PrizeSchemeId } from './types';
import { getPrizeSpecs, getSpecialSpec } from './schemes';
import { isFutureDate, isYyyyMmDd, normalizeDateFromPubDate, normalizeDateFromText } from './format';
import { stripHtml } from './text';

const LABEL_ALIASES: Record<string, string> = {
  db: 'Đặc biệt',
  'đb': 'Đặc biệt',
  'dac biet': 'Đặc biệt',
  'đặc biệt': 'Đặc biệt',
  gdb: 'Đặc biệt',
  'gdb.': 'Đặc biệt',
  'g.db': 'Đặc biệt',
  'g.đb': 'Đặc biệt',
  'g db': 'Đặc biệt',
  'g đb': 'Đặc biệt',
  g8: 'Giải tám',
  'g.8': 'Giải tám',
  tam: 'Giải tám',
  'tám': 'Giải tám',
  'giai tam': 'Giải tám',
  'giải tám': 'Giải tám',
  g7: 'Giải bảy',
  'g.7': 'Giải bảy',
  bay: 'Giải bảy',
  'bảy': 'Giải bảy',
  'giai bay': 'Giải bảy',
  'giải bảy': 'Giải bảy',
  g6: 'Giải sáu',
  'g.6': 'Giải sáu',
  sau: 'Giải sáu',
  'sáu': 'Giải sáu',
  'giai sau': 'Giải sáu',
  'giải sáu': 'Giải sáu',
  g5: 'Giải năm',
  'g.5': 'Giải năm',
  nam: 'Giải năm',
  'năm': 'Giải năm',
  'giai nam': 'Giải năm',
  'giải năm': 'Giải năm',
  g4: 'Giải tư',
  'g.4': 'Giải tư',
  tu: 'Giải tư',
  'tư': 'Giải tư',
  'giai tu': 'Giải tư',
  'giải tư': 'Giải tư',
  g3: 'Giải ba',
  'g.3': 'Giải ba',
  ba: 'Giải ba',
  'giai ba': 'Giải ba',
  'giải ba': 'Giải ba',
  g2: 'Giải nhì',
  'g.2': 'Giải nhì',
  nhi: 'Giải nhì',
  'nhì': 'Giải nhì',
  'giai nhi': 'Giải nhì',
  'giải nhì': 'Giải nhì',
  g1: 'Giải nhất',
  'g.1': 'Giải nhất',
  nhat: 'Giải nhất',
  'nhất': 'Giải nhất',
  'giai nhat': 'Giải nhất',
  'giải nhất': 'Giải nhất'
};

const STOP_WORDS = [
  'Tìm lô tô',
  'Tim lo to',
  'Mã ĐB',
  'Ma DB',
  'Xem thống kê',
  'Thong ke',
  'Hiện thêm kết quả',
  'Hien them ket qua',
  'Ảnh và kết quả',
  'Anh va ket qua',
  'Về ',
  'Ghi chú',
  'Tiện ích hay',
  'Tin tức'
];

function normalizeAlias(value: string) {
  return value
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .replace(/\s*\.\s*/g, '.')
    .replace(/[:：]/g, '')
    .trim();
}

function canonicalLabel(value: string) {
  const normalized = normalizeAlias(value);
  return LABEL_ALIASES[normalized] || LABEL_ALIASES[normalized.replace(/\s/g, '')] || null;
}

function getExpectedLengthMap(scheme: PrizeSchemeId) {
  return Object.fromEntries(getPrizeSpecs(scheme).map((spec) => [spec.label, spec.length]));
}

function getExpectedCountMap(scheme: PrizeSchemeId) {
  return Object.fromEntries(getPrizeSpecs(scheme).map((spec) => [spec.label, spec.count]));
}

function findPrizeMarkers(text: string) {
  const regex = /(ĐB|DB|Đặc\s*biệt|Dac\s*biet|G\.?\s*ĐB|G\.?\s*DB|G\.?\s*[1-8]|Giải\s*(?:tám|bảy|sáu|năm|tư|ba|nhì|nhất)|Giai\s*(?:tam|bay|sau|nam|tu|ba|nhi|nhat)|Tám|Tam|Bảy|Bay|Sáu|Sau|Năm|Nam|Tư|Tu|Ba|Nhì|Nhi|Nhất|Nhat)\s*[:：\-]?/giu;

  const markers: Array<{ index: number; end: number; label: string }> = [];
  for (const match of text.matchAll(regex)) {
    const raw = match[1]
      .replace(/\s+/g, ' ')
      .replace(/^G\.\s*/iu, 'G.')
      .replace(/^G\s*/iu, 'G');
    const label = canonicalLabel(raw);
    if (!label) continue;
    markers.push({ index: match.index || 0, end: (match.index || 0) + match[0].length, label });
  }

  return markers.filter((marker, index, arr) => {
    const previous = arr[index - 1];
    return !(previous && previous.label === marker.label && marker.index - previous.index < 8);
  });
}

function extractNumericTokens(segment: string) {
  return Array.from(segment.matchAll(/(?<!\d)\d{2,6}(?!\d)/g)).map((match) => match[0]);
}

function firstStopIndex(segment: string) {
  let stopIndex = -1;
  for (const word of STOP_WORDS) {
    const index = segment.search(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    if (index >= 0 && (stopIndex < 0 || index < stopIndex)) stopIndex = index;
  }
  return stopIndex;
}

function trimSegment(segment: string) {
  const stopIndex = firstStopIndex(segment);
  return stopIndex >= 0 ? segment.slice(0, stopIndex) : segment;
}

function sortRows(rows: PrizeRow[], scheme: PrizeSchemeId) {
  const order = getPrizeSpecs(scheme).map((spec) => spec.label);
  return order.flatMap((label) => rows.filter((row) => row.label === label));
}

function trimToExpectedCounts(rows: PrizeRow[], scheme: PrizeSchemeId) {
  const expectedCounts = getExpectedCountMap(scheme);
  const expectedLengths = getExpectedLengthMap(scheme);

  return rows
    .map((row) => {
      const expectedCount = expectedCounts[row.label];
      const expectedLength = expectedLengths[row.label];
      if (!expectedCount || !expectedLength) return null;

      const numbers = row.numbers
        .map((value) => String(value).trim())
        .filter((value) => /^\d+$/.test(value))
        .filter((value) => value.length === expectedLength)
        .slice(0, expectedCount);

      return numbers.length ? { label: row.label, numbers } : null;
    })
    .filter((row): row is PrizeRow => Boolean(row));
}

function hasOverflowRow(rows: PrizeRow[], scheme: PrizeSchemeId) {
  const expectedCounts = getExpectedCountMap(scheme);
  return rows.some((row) => {
    const expectedCount = expectedCounts[row.label];
    return Boolean(expectedCount && row.numbers.length > expectedCount);
  });
}

function scoreRows(rows: PrizeRow[], scheme: PrizeSchemeId) {
  const expectedCounts = getExpectedCountMap(scheme);
  return rows.reduce((score, row) => score + (expectedCounts[row.label] ? row.numbers.length : 0), 0);
}

function canonicalRowsFromTokens(tokens: string[], scheme: PrizeSchemeId): PrizeRow[] {
  const rows: PrizeRow[] = [];
  let cursor = 0;

  for (const spec of getPrizeSpecs(scheme)) {
    const numbers: string[] = [];

    while (cursor < tokens.length && numbers.length < spec.count) {
      const token = tokens[cursor];
      cursor += 1;
      if (token.length !== spec.length) continue;
      numbers.push(token);
    }

    if (!numbers.length) break;
    rows.push({ label: spec.label, numbers });
    if (numbers.length < spec.count) break;
  }

  return rows;
}

function parseCanonicalRowsFromText(text: string, scheme: PrizeSchemeId, markers: ReturnType<typeof findPrizeMarkers>) {
  const firstKnownMarker = markers.find((marker) => getPrizeSpecs(scheme).some((spec) => spec.label === marker.label)) || markers[0];
  const prizeText = firstKnownMarker ? text.slice(firstKnownMarker.end) : text;
  return canonicalRowsFromTokens(extractNumericTokens(trimSegment(prizeText)), scheme);
}

export function parsePrizeRowsFromText(rawText: string, scheme: PrizeSchemeId): PrizeRow[] {
  const text = stripHtml(rawText);
  const markers = findPrizeMarkers(text).filter((marker) => getPrizeSpecs(scheme).some((spec) => spec.label === marker.label));
  const rowMap = new Map<string, string[]>();
  const expectedLengths = getExpectedLengthMap(scheme);

  markers.forEach((marker, index) => {
    const next = markers[index + 1];
    const segment = trimSegment(text.slice(marker.end, next?.index ?? text.length));
    const expectedLength = expectedLengths[marker.label];
    const numbers = extractNumericTokens(segment).filter((numberValue) => numberValue.length === expectedLength);
    if (!numbers.length) return;
    rowMap.set(marker.label, [...(rowMap.get(marker.label) || []), ...numbers]);
  });

  const markerRows = sortRows(
    Array.from(rowMap.entries()).map(([label, numbers]) => ({
      label,
      numbers
    })),
    scheme
  );

  const canonicalRows = parseCanonicalRowsFromText(text, scheme, markers);

  if (!markerRows.length) return canonicalRows;
  if (hasOverflowRow(markerRows, scheme) && canonicalRows.length > 1) return canonicalRows;
  if (scoreRows(canonicalRows, scheme) > scoreRows(markerRows, scheme) && canonicalRows.length > markerRows.length) {
    return canonicalRows;
  }

  return trimToExpectedCounts(markerRows, scheme);
}

export function normalizePrizeRows(rows: PrizeRow[], scheme: PrizeSchemeId): PrizeRow[] {
  const rowMap = new Map<string, string[]>();
  const expectedLengths = getExpectedLengthMap(scheme);

  for (const row of rows) {
    if (!row || typeof row.label !== 'string' || !Array.isArray(row.numbers)) continue;

    const label = canonicalLabel(row.label) || row.label;
    const expectedLength = expectedLengths[label];
    if (!expectedLength) continue;

    const numbers = row.numbers
      .map((value) => String(value).trim())
      .filter((value) => /^\d+$/.test(value))
      .filter((value) => value.length === expectedLength);

    if (!numbers.length) continue;
    rowMap.set(label, [...(rowMap.get(label) || []), ...numbers]);
  }

  return trimToExpectedCounts(
    sortRows(
      Array.from(rowMap.entries()).map(([label, numbers]) => ({ label, numbers })),
      scheme
    ),
    scheme
  );
}

function extractDataObject(value: unknown): unknown {
  if (typeof value === 'object' && value !== null && 'data' in value) return (value as { data: unknown }).data;
  return value;
}

export function normalizeApiResult(value: unknown, source: LotterySourceConfig, sourceName = 'API dữ liệu xổ số'): LotteryResult | null {
  const payload = extractDataObject(value) as Partial<LotteryResult>;
  if (!payload || typeof payload !== 'object') return null;

  const date = typeof payload.date === 'string' ? payload.date : null;
  const rawRows = Array.isArray(payload.prizes) ? payload.prizes : [];
  const prizes = normalizePrizeRows(rawRows as PrizeRow[], source.scheme);
  const specialPrize = typeof payload.specialPrize === 'string'
    ? payload.specialPrize
    : prizes.find((row) => row.label === 'Đặc biệt')?.numbers[0];

  if (!date || !specialPrize || !prizes.length) return null;

  const result: LotteryResult = {
    date,
    code: payload.code || source.code,
    region: payload.region || source.region,
    province: payload.province || source.name.replace(/^Xổ số\s+/i, ''),
    shortName: payload.shortName || source.shortName,
    scheme: payload.scheme || source.scheme,
    specialPrize,
    prizes,
    sourceName: payload.sourceName || sourceName,
    sourceUrl: payload.sourceUrl,
    updatedAt: payload.updatedAt || new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    dataSource: 'api'
  };

  return hasUsableLotteryResult(result) ? result : null;
}

export function normalizeResultFromText(
  rawText: string,
  source: LotterySourceConfig,
  options: { date?: string; sourceUrl?: string; sourceName?: string; updatedAt?: string; dataSource?: 'rss' | 'html' } = {}
): LotteryResult | null {
  const cleanText = stripHtml(rawText);
  const date = options.date || normalizeDateFromText(cleanText) || normalizeDateFromPubDate(options.updatedAt);
  if (!date) return null;

  const prizes = parsePrizeRowsFromText(cleanText, source.scheme);
  const specialPrize = prizes.find((row) => row.label === 'Đặc biệt')?.numbers[0];
  if (!specialPrize) return null;

  const result: LotteryResult = {
    date,
    code: source.code,
    region: source.region,
    province: source.name.replace(/^Xổ số\s+/i, ''),
    shortName: source.shortName,
    scheme: source.scheme,
    specialPrize,
    prizes,
    sourceName: options.sourceName || 'XSKT',
    sourceUrl: options.sourceUrl,
    updatedAt: options.updatedAt && !Number.isNaN(new Date(options.updatedAt).getTime()) ? new Date(options.updatedAt).toISOString() : new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    dataSource: options.dataSource || 'html'
  };

  return hasUsableLotteryResult(result) ? result : null;
}


export function normalizeLiveResultFromText(
  rawText: string,
  source: LotterySourceConfig,
  options: { date?: string; sourceUrl?: string; sourceName?: string; updatedAt?: string; dataSource?: 'rss' | 'html' } = {}
): LotteryLiveResult | null {
  const cleanText = stripHtml(rawText);
  const date = options.date || normalizeDateFromText(cleanText) || normalizeDateFromPubDate(options.updatedAt);
  if (!date || !isYyyyMmDd(date) || isFutureDate(date)) return null;

  const prizes = parsePrizeRowsFromText(cleanText, source.scheme);
  if (!prizes.length) return null;

  const specialLabel = getSpecialSpec(source.scheme).label;
  const specialPrize = prizes.find((row) => row.label === specialLabel)?.numbers[0];
  const completenessScore = lotteryRowsCompletenessScore(prizes, source.scheme);
  const expectedScore = expectedCompletenessScore(source.scheme);
  const isComplete = Boolean(specialPrize) && arePrizeRowsComplete(prizes, source.scheme);

  return {
    date,
    code: source.code,
    region: source.region,
    province: source.name.replace(/^Xổ số\s+/i, ''),
    shortName: source.shortName,
    scheme: source.scheme,
    specialPrize,
    prizes,
    sourceName: options.sourceName || 'XSKT RSS',
    sourceUrl: options.sourceUrl,
    updatedAt:
      options.updatedAt && !Number.isNaN(new Date(options.updatedAt).getTime())
        ? new Date(options.updatedAt).toISOString()
        : new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    dataSource: options.dataSource || 'rss',
    isComplete,
    status: isComplete ? 'complete' : 'running',
    completenessScore,
    expectedScore
  };
}

export function hasUsableLotteryResult(value: LotteryResult | null): value is LotteryResult {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date) || isFutureDate(value.date)) return false;

  const specialSpec = getSpecialSpec(value.scheme);
  if (!value.specialPrize || !new RegExp(`^\\d{${specialSpec.length}}$`).test(value.specialPrize)) return false;

  const hasSpecialPrizeRow = value.prizes.some(
    (row) => row.label === specialSpec.label && row.numbers.includes(value.specialPrize)
  );
  if (!hasSpecialPrizeRow) return false;

  const specs = getPrizeSpecs(value.scheme);
  return value.prizes.every((row) => {
    const spec = specs.find((item) => item.label === row.label);
    if (!spec) return false;
    if (row.numbers.length > spec.count) return false;
    return row.numbers.every((numberValue) => /^\d+$/.test(numberValue) && numberValue.length === spec.length);
  });
}

export function lotteryCompletenessScore(value: LotteryResult | null) {
  if (!hasUsableLotteryResult(value)) return 0;
  const specs = getPrizeSpecs(value.scheme);
  return specs.reduce((score, spec) => {
    const row = value.prizes.find((item) => item.label === spec.label);
    if (!row) return score;
    return score + Math.min(row.numbers.length, spec.count);
  }, 0);
}

export function expectedCompletenessScore(scheme: PrizeSchemeId) {
  return getPrizeSpecs(scheme).reduce((score, spec) => score + spec.count, 0);
}

export function isCompleteLotteryResult(value: LotteryResult | null): value is LotteryResult {
  if (!hasUsableLotteryResult(value)) return false;

  return getPrizeSpecs(value.scheme).every((spec) => {
    const row = value.prizes.find((item) => item.label === spec.label);
    return Boolean(row && row.numbers.length === spec.count);
  });
}


export function lotteryRowsCompletenessScore(rows: PrizeRow[], scheme: PrizeSchemeId) {
  const specs = getPrizeSpecs(scheme);
  return specs.reduce((score, spec) => {
    const row = rows.find((item) => item.label === spec.label);
    return score + Math.min(row?.numbers.length || 0, spec.count);
  }, 0);
}

function arePrizeRowsComplete(rows: PrizeRow[], scheme: PrizeSchemeId) {
  return getPrizeSpecs(scheme).every((spec) => {
    const row = rows.find((item) => item.label === spec.label);
    return Boolean(row && row.numbers.length === spec.count);
  });
}

function getPayloadObject(value: unknown): Record<string, unknown> | null {
  const payload = extractDataObject(value);
  return typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : null;
}

function normalizeLiveDate(value: unknown) {
  return typeof value === 'string' && isYyyyMmDd(value) && !isFutureDate(value) ? value : null;
}

export function normalizeLiveApiResult(
  value: unknown,
  source: LotterySourceConfig,
  options: { date?: string; sourceName?: string } = {}
): LotteryLiveResult | null {
  const payload = getPayloadObject(value);
  if (!payload) return null;

  const rawRows = Array.isArray(payload.prizes)
    ? payload.prizes
    : Array.isArray(payload.results)
      ? payload.results
      : [];
  const prizes = normalizePrizeRows(rawRows as PrizeRow[], source.scheme);
  const date = normalizeLiveDate(payload.date) || normalizeLiveDate(options.date);
  if (!date || !prizes.length) return null;

  const specialPrize =
    typeof payload.specialPrize === 'string'
      ? payload.specialPrize
      : prizes.find((row) => row.label === getSpecialSpec(source.scheme).label)?.numbers[0];

  const completenessScore = lotteryRowsCompletenessScore(prizes, source.scheme);
  const expectedScore = expectedCompletenessScore(source.scheme);
  const isComplete = arePrizeRowsComplete(prizes, source.scheme);

  return {
    date,
    code: source.code,
    region: source.region,
    province: source.name.replace(/^Xổ số\s+/i, ''),
    shortName: source.shortName,
    scheme: source.scheme,
    specialPrize,
    prizes,
    sourceName: typeof payload.sourceName === 'string' ? payload.sourceName : options.sourceName || 'API tường thuật xổ số',
    sourceUrl: typeof payload.sourceUrl === 'string' ? payload.sourceUrl : undefined,
    updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    dataSource: 'live-api',
    isComplete,
    status: isComplete ? 'complete' : 'running',
    completenessScore,
    expectedScore
  };
}

function liveResultUpdatedAt(value: LotteryLiveResult) {
  const timestamp = new Date(value.updatedAt).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function pickBetterLiveResult(
  current: LotteryLiveResult | null,
  candidate: LotteryLiveResult | null
): LotteryLiveResult | null {
  if (!candidate) return current;
  if (!current) return candidate;

  if (candidate.date !== current.date) {
    return candidate.date > current.date ? candidate : current;
  }

  if (candidate.isComplete !== current.isComplete) {
    return candidate.isComplete ? candidate : current;
  }

  const currentScore = lotteryRowsCompletenessScore(current.prizes, current.scheme);
  const candidateScore = lotteryRowsCompletenessScore(candidate.prizes, candidate.scheme);
  if (candidateScore !== currentScore) return candidateScore > currentScore ? candidate : current;

  const currentUpdatedAt = liveResultUpdatedAt(current);
  const candidateUpdatedAt = liveResultUpdatedAt(candidate);
  if (candidateUpdatedAt !== currentUpdatedAt) {
    return candidateUpdatedAt > currentUpdatedAt ? candidate : current;
  }

  const priority: Record<string, number> = {
    'live-api': 4,
    html: 3,
    rss: 2,
    cache: 1,
    api: 1,
    mock: 0
  };
  const currentPriority = priority[current.dataSource || 'cache'] ?? 0;
  const candidatePriority = priority[candidate.dataSource || 'cache'] ?? 0;
  if (candidatePriority !== currentPriority) {
    return candidatePriority > currentPriority ? candidate : current;
  }

  // Cùng tiến độ và thời điểm: lấy snapshot vừa fetch để chấp nhận dữ liệu nguồn đã sửa.
  return candidate;
}

export function liveResultToCompleteLotteryResult(value: LotteryLiveResult | null): LotteryResult | null {
  if (!value || !value.isComplete || !value.specialPrize) return null;

  const result: LotteryResult = {
    date: value.date,
    code: value.code,
    region: value.region,
    province: value.province,
    shortName: value.shortName,
    scheme: value.scheme,
    specialPrize: value.specialPrize,
    prizes: value.prizes,
    sourceName: value.sourceName,
    sourceUrl: value.sourceUrl,
    updatedAt: value.updatedAt,
    fetchedAt: value.fetchedAt,
    dataSource: value.dataSource === 'live-api' ? 'api' : value.dataSource
  };

  return isCompleteLotteryResult(result) ? result : null;
}

export function pickBetterLotteryResult(
  current: LotteryResult | null,
  candidate: LotteryResult | null
): LotteryResult | null {
  if (!candidate) return current;
  if (!current) return candidate;

  const currentComplete = isCompleteLotteryResult(current);
  const candidateComplete = isCompleteLotteryResult(candidate);
  if (candidateComplete && !currentComplete) return candidate;
  if (currentComplete && !candidateComplete) return current;

  const currentScore = lotteryCompletenessScore(current);
  const candidateScore = lotteryCompletenessScore(candidate);
  if (candidateScore > currentScore) return candidate;

  // Khi độ đầy đủ bằng nhau, ưu tiên thứ tự nguồn ổn định hơn cho SEO.
  const priority: Record<string, number> = { api: 4, html: 3, cache: 2, rss: 1, mock: 0 };
  const currentPriority = priority[current.dataSource || 'cache'] ?? 0;
  const candidatePriority = priority[candidate.dataSource || 'cache'] ?? 0;
  return candidatePriority > currentPriority ? candidate : current;
}
