import type { LiveDrawWindow, LotteryLiveResult, LotteryResult, LotterySourceConfig } from './types';
import { getPrizeSpecs } from './schemes';
import { expectedCompletenessScore, isCompleteLotteryResult, lotteryCompletenessScore } from './normalize';
import { todayInVietnam } from './format';

const DEFAULT_DRAW_TIMES: Record<LotterySourceConfig['region'], string> = {
  north: '18:15',
  south: '16:10',
  central: '17:15',
  vietlott: '18:00',
  computer: '18:00'
};

function numberFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function vietnamDateTimeParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(now);

  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = value.hour === '24' ? 0 : Number(value.hour || 0);

  return {
    date: `${value.year}-${value.month}-${value.day}`,
    hour,
    minute: Number(value.minute || 0),
    second: Number(value.second || 0)
  };
}

function minutesFromTime(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function timeFromMinutes(value: number) {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, value));
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function drawTimeForSource(source: LotterySourceConfig) {
  const envKey = `LOTTERY_LIVE_DRAW_TIME_${source.code.toUpperCase()}`;
  const regionEnvKey = `LOTTERY_LIVE_DRAW_TIME_${source.region.toUpperCase()}`;
  const custom = process.env[envKey] || process.env[regionEnvKey];
  return /^\d{2}:\d{2}$/.test(custom || '') ? custom! : DEFAULT_DRAW_TIMES[source.region];
}

export function getLiveDrawWindow(source: LotterySourceConfig, now = new Date()): LiveDrawWindow {
  const startBeforeMinutes = numberFromEnv('LOTTERY_LIVE_START_BEFORE_MINUTES', 10);
  const endAfterMinutes = numberFromEnv('LOTTERY_LIVE_END_AFTER_MINUTES', 75);
  const fastPollMs = numberFromEnv('LOTTERY_LIVE_FAST_POLL_MS', 5000);
  const slowPollMs = numberFromEnv('LOTTERY_LIVE_SLOW_POLL_MS', 15000);

  const vietnamNow = vietnamDateTimeParts(now);
  const nowMinutes = vietnamNow.hour * 60 + vietnamNow.minute;
  const drawTime = drawTimeForSource(source);
  const drawMinutes = minutesFromTime(drawTime);
  const startMinutes = drawMinutes - startBeforeMinutes;
  const endMinutes = drawMinutes + endAfterMinutes;
  const shouldPoll = nowMinutes >= startMinutes && nowMinutes <= endMinutes;

  return {
    code: source.code,
    date: vietnamNow.date,
    drawTime,
    startTime: timeFromMinutes(startMinutes),
    endTime: timeFromMinutes(endMinutes),
    isLiveWindow: shouldPoll,
    shouldPoll,
    pollIntervalMs: nowMinutes >= drawMinutes ? fastPollMs : slowPollMs,
    label: `${source.shortName} mở thưởng khoảng ${drawTime}`
  };
}

export function shouldShowLivePanel(source: LotterySourceConfig, result?: LotteryResult | null) {
  void result;
  const liveWindow = getLiveDrawWindow(source);
  return liveWindow.shouldPoll;
}

export function toLiveLotteryResult(result: LotteryResult, status: LotteryLiveResult['status'] = 'complete'): LotteryLiveResult {
  const isComplete = isCompleteLotteryResult(result);
  return {
    ...result,
    isComplete,
    status: isComplete ? 'complete' : status,
    completenessScore: lotteryCompletenessScore(result),
    expectedScore: expectedCompletenessScore(result.scheme)
  };
}

export function isTodayLiveDate(date?: string | null, now = new Date()) {
  return Boolean(date && date === todayInVietnam(now));
}


export function createLivePlaceholderResult(source: LotterySourceConfig, date: string): LotteryResult {
  return {
    date,
    code: source.code,
    region: source.region,
    province: source.name.replace(/^Xổ số\s+/i, ''),
    shortName: source.shortName,
    scheme: source.scheme,
    specialPrize: '',
    prizes: getPrizeSpecs(source.scheme).map((spec) => ({ label: spec.label, numbers: [] })),
    sourceName: source.rssTitle || source.name,
    sourceUrl: source.rssUrl,
    updatedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    dataSource: 'cache'
  };
}
