export type VietlottProductId = 'mega-645' | 'power-655' | 'max-3d' | 'max-3d-pro';

export type VietlottDataSource = 'api' | 'html' | 'cache' | 'mock';

export type VietlottProductConfig = {
  id: VietlottProductId;
  name: string;
  shortName: string;
  xsktPath: string;
  aliases: string[];
  schedule: string;
  description: string;
};

export type VietlottPrizeRow = {
  label: string;
  numbers?: string[];
  matchText?: string;
  winners?: string;
  prizeValue?: string;
};

export type VietlottResult = {
  product: VietlottProductId;
  productName: string;
  shortName: string;
  date: string;
  drawId?: string;
  numbers: string[];
  bonusNumber?: string;
  rows: VietlottPrizeRow[];
  sourceName: string;
  sourceUrl?: string;
  updatedAt: string;
  fetchedAt?: string;
  dataSource?: VietlottDataSource;
  isMock?: boolean;
};

export type VietlottProviderMode = 'auto' | 'api' | 'html' | 'mock';
