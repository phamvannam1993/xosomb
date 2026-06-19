import type { LotteryResult } from './types';

export const mockLotteryResults: LotteryResult[] = [
  {
    date: '2026-06-19',
    code: 'xsmb',
    region: 'north',
    province: 'Miền Bắc',
    shortName: 'XSMB',
    scheme: 'north',
    specialPrize: '48213',
    prizes: [
      { label: 'Đặc biệt', numbers: ['48213'] },
      { label: 'Giải nhất', numbers: ['21984'] },
      { label: 'Giải nhì', numbers: ['63021', '70438'] },
      { label: 'Giải ba', numbers: ['21953', '84602', '57391', '18044', '93726', '49170'] },
      { label: 'Giải tư', numbers: ['2951', '8307', '1644', '7282'] },
      { label: 'Giải năm', numbers: ['8123', '0948', '3762', '5506', '7391', '4029'] },
      { label: 'Giải sáu', numbers: ['148', '283', '509'] },
      { label: 'Giải bảy', numbers: ['17', '34', '62', '90'] }
    ],
    sourceName: 'Dữ liệu mẫu nội bộ',
    updatedAt: '2026-06-19T18:45:00+07:00',
    dataSource: 'mock',
    isMock: true
  },
  {
    date: '2026-06-18',
    code: 'xsmb',
    region: 'north',
    province: 'Miền Bắc',
    shortName: 'XSMB',
    scheme: 'north',
    specialPrize: '15032',
    prizes: [
      { label: 'Đặc biệt', numbers: ['15032'] },
      { label: 'Giải nhất', numbers: ['96675'] },
      { label: 'Giải nhì', numbers: ['55836', '27341'] },
      { label: 'Giải ba', numbers: ['30537', '37226', '15283', '85155', '07752', '33106'] },
      { label: 'Giải tư', numbers: ['3023', '3583', '7460', '2755'] },
      { label: 'Giải năm', numbers: ['5691', '1765', '4030', '1091', '2586', '8796'] },
      { label: 'Giải sáu', numbers: ['927', '271', '124'] },
      { label: 'Giải bảy', numbers: ['33', '08', '05', '68'] }
    ],
    sourceName: 'Dữ liệu mẫu nội bộ',
    updatedAt: '2026-06-18T18:45:00+07:00',
    dataSource: 'mock',
    isMock: true
  },
  {
    date: '2026-06-15',
    code: 'xsdt',
    region: 'south',
    province: 'Đồng Tháp',
    shortName: 'XSDT',
    scheme: 'southCentral',
    specialPrize: '105318',
    prizes: [
      { label: 'Giải tám', numbers: ['98'] },
      { label: 'Giải bảy', numbers: ['581'] },
      { label: 'Giải sáu', numbers: ['9076', '2509', '5374'] },
      { label: 'Giải năm', numbers: ['8203'] },
      { label: 'Giải tư', numbers: ['52472', '67062', '77819', '45346', '26013', '92814', '83903'] },
      { label: 'Giải ba', numbers: ['91022', '30086'] },
      { label: 'Giải nhì', numbers: ['20258'] },
      { label: 'Giải nhất', numbers: ['20779'] },
      { label: 'Đặc biệt', numbers: ['105318'] }
    ],
    sourceName: 'Dữ liệu mẫu nội bộ',
    updatedAt: '2026-06-15T16:45:00+07:00',
    dataSource: 'mock',
    isMock: true
  },
  {
    date: '2026-06-19',
    code: 'xsbd',
    region: 'south',
    province: 'Bình Dương',
    shortName: 'XSBD',
    scheme: 'southCentral',
    specialPrize: '945100',
    prizes: [
      { label: 'Giải tám', numbers: ['62'] },
      { label: 'Giải bảy', numbers: ['111'] },
      { label: 'Giải sáu', numbers: ['5478', '2485', '9472'] },
      { label: 'Giải năm', numbers: ['5051'] },
      { label: 'Giải tư', numbers: ['53053', '02790', '49927', '80339', '90896', '06818', '67721'] },
      { label: 'Giải ba', numbers: ['14515', '57637'] },
      { label: 'Giải nhì', numbers: ['86077'] },
      { label: 'Giải nhất', numbers: ['06652'] },
      { label: 'Đặc biệt', numbers: ['945100'] }
    ],
    sourceName: 'Dữ liệu mẫu nội bộ',
    updatedAt: '2026-06-19T16:45:00+07:00',
    dataSource: 'mock',
    isMock: true
  }
];

export function mockByCodeDate(code: string, date: string) {
  const exact = mockLotteryResults.find((item) => item.code === code && item.date === date);
  if (exact) return { ...exact, dataSource: 'mock' as const, isMock: true };
  return null;
}

export function mockRecentByCode(code: string, limit = 30) {
  return mockLotteryResults
    .filter((item) => item.code === code)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((item) => ({ ...item, dataSource: 'mock' as const, isMock: true }));
}

export function mockLatestByCode(code: string) {
  return mockRecentByCode(code, 1)[0] || null;
}
