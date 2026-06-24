import type { LotteryLiveResult, PrizeRow } from './types';
import { getLotterySource } from './catalog';
import { getCurrentTimeInVietnam } from './format';
import { expectedCompletenessScore, lotteryRowsCompletenessScore } from './normalize';
import { getPrizeSpecs, getSpecialSpec } from './schemes';
import { stripHtml } from './text';

// Cache rất ngắn để tránh nhiều client live cùng lúc đánh liên tục vào nguồn ngoài.
let cachedResult: LotteryLiveResult | null = null;
let cachedTime = 0;
const CACHE_DURATION = 2_000;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanNumber(value: string, expectedLength: number) {
  const digits = stripHtml(value).replace(/\D/g, '');
  return digits.length === expectedLength ? digits : null;
}

function extractById(html: string, id: string) {
  const regex = new RegExp(`id=["']?${escapeRegExp(id)}["']?[^>]*>([\\s\\S]*?)<`, 'i');
  return regex.exec(html)?.[1] || '';
}

function extractNumbers(html: string, idPrefix: string, expectedLength: number, maxCount: number) {
  const numbers: string[] = [];

  for (let index = 0; index < maxCount; index += 1) {
    const value = cleanNumber(extractById(html, `${idPrefix}${index}`), expectedLength);
    if (value) numbers.push(value);
  }

  return numbers;
}

function buildXsmbRows(html: string): PrizeRow[] {
  const prefixByLabel: Record<string, string> = {
    'Đặc biệt': 'mb_prizeDB_item',
    'Giải nhất': 'mb_prize1_item',
    'Giải nhì': 'mb_prize2_item',
    'Giải ba': 'mb_prize3_item',
    'Giải tư': 'mb_prize4_item',
    'Giải năm': 'mb_prize5_item',
    'Giải sáu': 'mb_prize6_item',
    'Giải bảy': 'mb_prize7_item'
  };

  return getPrizeSpecs('north')
    .map((spec) => ({
      label: spec.label,
      numbers: extractNumbers(html, prefixByLabel[spec.label], spec.length, spec.count).slice(0, spec.count)
    }))
    .filter((row) => row.numbers.length > 0);
}

export async function fetchLiveFromXosoWebsite(date: string): Promise<LotteryLiveResult | null> {
  const source = getLotterySource('xsmb');
  if (!source) return null;

  if (cachedResult?.date === date && Date.now() - cachedTime < CACHE_DURATION) {
    return cachedResult;
  }

  const url = 'https://xoso.com.vn/';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; xosomb.vn live fetcher/1.1)',
        Accept: 'text/html,application/xhtml+xml'
      },
      cache: 'no-store',
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) return null;

    const html = await response.text();
    const prizes = buildXsmbRows(html);
    const completenessScore = lotteryRowsCompletenessScore(prizes, 'north');
    if (!completenessScore) return null;

    const expectedScore = expectedCompletenessScore('north');
    const specialLabel = getSpecialSpec('north').label;
    const specialPrize = prizes.find((row) => row.label === specialLabel)?.numbers[0];
    const isComplete = Boolean(specialPrize) && completenessScore === expectedScore;
    const now = getCurrentTimeInVietnam();

    const result: LotteryLiveResult = {
      date,
      code: source.code,
      region: source.region,
      province: source.name.replace(/^Xổ số\s+/i, ''),
      shortName: source.shortName,
      scheme: source.scheme,
      specialPrize,
      prizes,
      sourceName: 'XoSo.com.vn Live',
      sourceUrl: url,
      updatedAt: now,
      fetchedAt: now,
      dataSource: 'html',
      isComplete,
      status: isComplete ? 'complete' : 'running',
      completenessScore,
      expectedScore
    };

    cachedResult = result;
    cachedTime = Date.now();

    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
