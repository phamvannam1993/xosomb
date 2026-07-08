import type { LotteryResult } from './types';
import { ddMmYyyyFromDate, getAllNumbers, getLastTwoDigits, isYyyyMmDd } from './format';

export const FREQUENCY_PAGE_PATH = '/thong-ke-tan-suat-lo-to-mien-bac.html';
export const FREQUENCY_DAY_OPTIONS = [30, 60, 100, 210, 300] as const;
export const FREQUENCY_TYPE_OPTIONS = ['0', '1'] as const;

export type FrequencyDayOption = (typeof FREQUENCY_DAY_OPTIONS)[number];
export type FrequencyStatType = (typeof FREQUENCY_TYPE_OPTIONS)[number];
export type FrequencyTableSource = 'az24-html' | 'local-results';

export type FrequencyCell = {
  count: number;
  isSpecial: boolean;
  title?: string;
};

export type FrequencyDateColumn = {
  date: string;
  day: string;
  month: string;
  year: string;
  label: string;
};

export type FrequencyRow = {
  digit: string;
  total: number;
  cells: FrequencyCell[];
};

export type FrequencyTableData = {
  title: string;
  columns: FrequencyDateColumn[];
  rows: FrequencyRow[];
  fromDate?: string;
  toDate?: string;
  source: FrequencyTableSource;
  resultCount: number;
  note?: string;
};

export type FrequencyBuildOptions = {
  selectedDigits: string[];
  numOfDay: number;
  statType: FrequencyStatType;
};

export const ALL_TWO_DIGITS = Array.from({ length: 100 }, (_, index) => index.toString().padStart(2, '0'));

export function normalizeFrequencyDay(value: unknown): FrequencyDayOption {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return FREQUENCY_DAY_OPTIONS.includes(parsed as FrequencyDayOption) ? (parsed as FrequencyDayOption) : 60;
}

export function normalizeFrequencyType(value: unknown): FrequencyStatType {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === '1' ? '1' : '0';
}

export function sanitizeFrequencyDigits(values: unknown, fallbackToAll = true) {
  const rawValues = Array.isArray(values) ? values : typeof values === 'string' ? [values] : [];
  const digits = Array.from(
    new Set(
      rawValues
        .map((value) => String(value).trim())
        .filter((value) => /^\d{2}$/.test(value) && ALL_TWO_DIGITS.includes(value))
    )
  ).sort((a, b) => Number(a) - Number(b));

  return digits.length || !fallbackToAll ? digits : ALL_TWO_DIGITS;
}

export function dateColumnFromYyyyMmDd(dateValue: string): FrequencyDateColumn {
  if (!isYyyyMmDd(dateValue)) {
    return {
      date: dateValue,
      day: dateValue,
      month: '',
      year: '',
      label: dateValue
    };
  }

  const [year, month, day] = dateValue.split('-');
  return {
    date: dateValue,
    day,
    month,
    year: year.slice(-2),
    label: ddMmYyyyFromDate(dateValue)
  };
}

function buildFrequencyCells(result: LotteryResult, statType: FrequencyStatType) {
  const specialPair = getLastTwoDigits(result.specialPrize || '');
  const pairs = statType === '1'
    ? specialPair
      ? [specialPair]
      : []
    : getAllNumbers(result).map(getLastTwoDigits);

  const counts = new Map<string, number>();
  for (const pair of pairs) {
    if (/^\d{2}$/.test(pair)) counts.set(pair, (counts.get(pair) || 0) + 1);
  }

  return { counts, specialPair };
}

export function buildFrequencyTableFromResults(
  results: LotteryResult[],
  options: FrequencyBuildOptions
): FrequencyTableData {
  const selectedSet = new Set(sanitizeFrequencyDigits(options.selectedDigits, false));
  const selectedDigits = ALL_TWO_DIGITS.filter((digit) => selectedSet.has(digit));
  const sortedResults = [...results]
    .filter((result) => isYyyyMmDd(result.date))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, options.numOfDay);

  const columns = sortedResults.map((result) => dateColumnFromYyyyMmDd(result.date));
  const dayStats = sortedResults.map((result) => buildFrequencyCells(result, options.statType));

  const rows = selectedDigits.map((digit) => {
    const cells = dayStats.map(({ counts, specialPair }, index) => {
      const count = counts.get(digit) || 0;
      const isSpecial = specialPair === digit && count > 0;
      return {
        count,
        isSpecial,
        title: count > 0
          ? `${digit} về ${count} lần ngày ${columns[index]?.label || ''}${isSpecial ? ' ở giải đặc biệt' : ''}`
          : undefined
      };
    });

    return {
      digit,
      total: cells.reduce((sum, cell) => sum + cell.count, 0),
      cells
    };
  });

  const fromDate = columns.at(-1)?.label;
  const toDate = columns[0]?.label;
  const title = `Kết quả thống kê tần suất loto Miền Bắc${fromDate && toDate ? ` từ ${fromDate} đến ${toDate}` : ''}`;

  return {
    title,
    columns,
    rows,
    fromDate,
    toDate,
    source: 'local-results',
    resultCount: sortedResults.length,
    note: sortedResults.length < options.numOfDay
      ? `Hiện hệ thống có ${sortedResults.length}/${options.numOfDay} kỳ quay gần nhất trong cache/nguồn dữ liệu nội bộ.`
      : undefined
  };
}
