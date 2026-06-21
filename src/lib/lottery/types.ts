export type LotteryRegion = 'north' | 'south' | 'central' | 'vietlott' | 'computer';

export type PrizeRow = {
  label: string;
  numbers: string[];
};

export type PrizeSpec = {
  label: string;
  shortLabel: string;
  count: number;
  length: number;
  isSpecial?: boolean;
};

export type PrizeSchemeId = 'north' | 'southCentral';

export type LotteryDataSource = 'api' | 'live-api' | 'rss' | 'html' | 'cache' | 'mock';

export type LotterySourceConfig = {
  code: string;
  name: string;
  shortName: string;
  region: LotteryRegion;
  scheme: PrizeSchemeId;
  sourcePath?: string;
  rssUrl?: string;
  rssTitle?: string;
  aliases?: string[];
  slugAliases?: string[];
  schedule?: string;
};

export type LotteryResult = {
  date: string; // YYYY-MM-DD
  code: string;
  region: LotteryRegion;
  province: string;
  shortName: string;
  scheme: PrizeSchemeId;
  specialPrize: string;
  prizes: PrizeRow[];
  sourceName: string;
  sourceUrl?: string;
  updatedAt: string;
  fetchedAt?: string;
  dataSource?: LotteryDataSource;
  isMock?: boolean;
};


export type LotteryLiveStatus = 'waiting' | 'running' | 'complete';

export type LotteryLiveResult = Omit<LotteryResult, 'specialPrize'> & {
  specialPrize?: string;
  isComplete: boolean;
  status: LotteryLiveStatus;
  completenessScore: number;
  expectedScore: number;
};

export type LiveDrawWindow = {
  code: string;
  date: string;
  drawTime: string;
  startTime: string;
  endTime: string;
  isLiveWindow: boolean;
  shouldPoll: boolean;
  pollIntervalMs: number;
  label: string;
};

export type DigitStat = {
  digit: string;
  count: number;
};

export type ProviderMode = 'auto' | 'api' | 'rss' | 'html' | 'mock';
