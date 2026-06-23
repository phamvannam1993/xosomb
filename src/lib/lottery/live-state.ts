import type { LiveDrawWindow, LotteryLiveResult, PrizeRow, PrizeSchemeId } from './types';
import { getPrizeSpecs, getSpecialSpec } from './schemes';

function validTimestamp(value?: string | null) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function newestIsoTimestamp(...values: Array<string | null | undefined>) {
  const newest = values
    .map((value) => ({ value, timestamp: validTimestamp(value) }))
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  return newest?.timestamp ? new Date(newest.timestamp).toISOString() : new Date().toISOString();
}

function rowsByLabel(rows: PrizeRow[] = []) {
  return new Map(rows.map((row) => [row.label, row.numbers]));
}

const SOURCE_PRIORITY: Record<string, number> = {
  'live-api': 4,
  html: 3,
  rss: 2,
  cache: 1,
  api: 1,
  mock: 0
};

function shouldAcceptEqualLengthCorrection(current: LotteryLiveResult, incoming: LotteryLiveResult) {
  const currentUpdatedAt = validTimestamp(current.updatedAt);
  const incomingUpdatedAt = validTimestamp(incoming.updatedAt);

  if (currentUpdatedAt || incomingUpdatedAt) {
    if (incomingUpdatedAt !== currentUpdatedAt) return incomingUpdatedAt > currentUpdatedAt;
  }

  const currentPriority = SOURCE_PRIORITY[current.dataSource || 'cache'] ?? 0;
  const incomingPriority = SOURCE_PRIORITY[incoming.dataSource || 'cache'] ?? 0;
  if (incomingPriority !== currentPriority) return incomingPriority > currentPriority;

  // Khi nguồn không cung cấp updatedAt đáng tin cậy, fetchedAt là tiêu chí cuối.
  return validTimestamp(incoming.fetchedAt) >= validTimestamp(current.fetchedAt);
}

function mergeRows(current: LotteryLiveResult, incoming: LotteryLiveResult, scheme: PrizeSchemeId) {
  const currentRows = rowsByLabel(current.prizes);
  const incomingRows = rowsByLabel(incoming.prizes);
  const acceptCorrection = shouldAcceptEqualLengthCorrection(current, incoming);

  return getPrizeSpecs(scheme)
    .map((spec) => {
      const currentNumbers = (currentRows.get(spec.label) || []).slice(0, spec.count);
      const incomingNumbers = (incomingRows.get(spec.label) || []).slice(0, spec.count);

      // Snapshot tạm thời ít dữ liệu hơn không được làm mất số đã hiển thị.
      // Khi cùng số lượng, chỉ snapshot thực sự mới/ưu tiên hơn mới được đính chính.
      const numbers =
        incomingNumbers.length > currentNumbers.length ||
        (incomingNumbers.length === currentNumbers.length && incomingNumbers.length > 0 && acceptCorrection)
          ? incomingNumbers
          : currentNumbers;
      return numbers.length ? { label: spec.label, numbers } : null;
    })
    .filter((row): row is PrizeRow => Boolean(row));
}

function scoreRows(rows: PrizeRow[], scheme: PrizeSchemeId) {
  return getPrizeSpecs(scheme).reduce((score, spec) => {
    const row = rows.find((item) => item.label === spec.label);
    return score + Math.min(row?.numbers.length || 0, spec.count);
  }, 0);
}

function rowsAreComplete(rows: PrizeRow[], scheme: PrizeSchemeId) {
  return getPrizeSpecs(scheme).every((spec) => {
    const row = rows.find((item) => item.label === spec.label);
    return Boolean(row && row.numbers.length === spec.count);
  });
}

export function isUsableInitialLiveResult(value?: LotteryLiveResult | null) {
  return Boolean(value && value.dataSource !== 'mock' && !value.isMock);
}

/**
 * Gộp kết quả giữa các lần polling theo hướng đơn điệu: số ô đã có không bị giảm,
 * nhưng dữ liệu mới cùng số lượng vẫn được phép thay thế để nhận bản đính chính từ nguồn.
 */
export function mergeLiveLotteryResults(
  current: LotteryLiveResult | null,
  incoming: LotteryLiveResult | null
): LotteryLiveResult | null {
  if (!incoming) return current;
  if (!current || current.code !== incoming.code || current.date !== incoming.date || current.scheme !== incoming.scheme) {
    return incoming;
  }

  const prizes = mergeRows(current, incoming, incoming.scheme);
  const currentScore = scoreRows(current.prizes, incoming.scheme);
  const incomingScore = scoreRows(incoming.prizes, incoming.scheme);
  const completenessScore = scoreRows(prizes, incoming.scheme);
  const expectedScore = getPrizeSpecs(incoming.scheme).reduce((score, spec) => score + spec.count, 0);
  const specialLabel = getSpecialSpec(incoming.scheme).label;
  const specialPrize = prizes.find((row) => row.label === specialLabel)?.numbers[0];
  const isComplete = Boolean(specialPrize) && rowsAreComplete(prizes, incoming.scheme);
  const incomingIsAtLeastAsFresh = validTimestamp(incoming.updatedAt) >= validTimestamp(current.updatedAt);
  const preferIncomingMetadata =
    incoming.isComplete || incomingScore > currentScore || (incomingScore === currentScore && incomingIsAtLeastAsFresh);
  const metadata = preferIncomingMetadata ? incoming : current;

  return {
    ...metadata,
    prizes,
    specialPrize,
    updatedAt: newestIsoTimestamp(current.updatedAt, incoming.updatedAt),
    fetchedAt: newestIsoTimestamp(current.fetchedAt, incoming.fetchedAt),
    isComplete,
    status: isComplete ? 'complete' : completenessScore > 0 ? 'running' : 'waiting',
    completenessScore,
    expectedScore
  };
}

function vietnamNowParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = values.hour === '24' ? 0 : Number(values.hour || 0);

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: hour * 60 + Number(values.minute || 0)
  };
}

function minutesFromClock(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

export function isWithinLiveDrawWindow(liveWindow: LiveDrawWindow, now = new Date()) {
  const current = vietnamNowParts(now);
  if (current.date !== liveWindow.date) return false;

  const start = minutesFromClock(liveWindow.startTime);
  const end = minutesFromClock(liveWindow.endTime);
  if (start === null || end === null) return false;

  return start <= end
    ? current.minutes >= start && current.minutes <= end
    : current.minutes >= start || current.minutes <= end;
}

export function refreshLiveDrawWindow(liveWindow: LiveDrawWindow, now = new Date()): LiveDrawWindow {
  const shouldPoll = isWithinLiveDrawWindow(liveWindow, now);
  return liveWindow.shouldPoll === shouldPoll && liveWindow.isLiveWindow === shouldPoll
    ? liveWindow
    : { ...liveWindow, shouldPoll, isLiveWindow: shouldPoll };
}

export function hasLiveDrawStarted(liveWindow: LiveDrawWindow, now = new Date()) {
  const current = vietnamNowParts(now);
  if (current.date !== liveWindow.date) return current.date > liveWindow.date;

  const drawTime = minutesFromClock(liveWindow.drawTime);
  return drawTime !== null && current.minutes >= drawTime;
}
