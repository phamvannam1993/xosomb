import type { LotterySourceConfig } from './types';

export const XSKT_BASE_URL = 'https://xskt.com.vn';

const rss = (slug: string) => `${XSKT_BASE_URL}/rss-feed/${slug}.rss`;

// code là slug canonical trên site mình. sourcePath là slug thật trên XSKT.
// Một số tỉnh có 2 mã thường dùng: HCM (xshcm/xstp), Lâm Đồng (xsld/xsdl),
// Quảng Nam (xsqnm/xsqna). Giữ slugAliases để URL cũ/biến thể không 404.
export const LOTTERY_SOURCES: LotterySourceConfig[] = [
  {
    code: 'xsmb',
    name: 'Xổ số miền Bắc',
    shortName: 'XSMB',
    region: 'north',
    scheme: 'north',
    sourcePath: '/xsmb',
    rssUrl: rss('mien-bac-xsmb'),
    rssTitle: 'RSS feed xổ số Miền Bắc',
    aliases: ['Miền Bắc', 'XSMB', 'SXMB'],
    schedule: 'Mở thưởng hằng ngày khoảng 18h15.'
  },
  {
    code: 'xsmn',
    name: 'Xổ số miền Nam',
    shortName: 'XSMN',
    region: 'south',
    scheme: 'southCentral',
    sourcePath: '/xsmn',
    rssUrl: rss('mien-nam-xsmn'),
    rssTitle: 'RSS feed xổ số Miền Nam',
    aliases: ['Miền Nam', 'XSMN', 'SXMN'],
    schedule: 'Mở thưởng hằng ngày khoảng 16h10.'
  },
  {
    code: 'xsmt',
    name: 'Xổ số miền Trung',
    shortName: 'XSMT',
    region: 'central',
    scheme: 'southCentral',
    sourcePath: '/xsmt',
    rssUrl: rss('mien-trung-xsmt'),
    rssTitle: 'RSS feed xổ số Miền Trung',
    aliases: ['Miền Trung', 'XSMT', 'SXMT'],
    schedule: 'Mở thưởng hằng ngày khoảng 17h15.'
  },

  // Miền Nam
  { code: 'xsag', name: 'Xổ số An Giang', shortName: 'XSAG', region: 'south', scheme: 'southCentral', sourcePath: '/xsag', rssUrl: rss('an-giang-xsag'), aliases: ['An Giang'] },
  { code: 'xscm', name: 'Xổ số Cà Mau', shortName: 'XSCM', region: 'south', scheme: 'southCentral', sourcePath: '/xscm', rssUrl: rss('ca-mau-xscm'), aliases: ['Cà Mau'] },
  { code: 'xsct', name: 'Xổ số Cần Thơ', shortName: 'XSCT', region: 'south', scheme: 'southCentral', sourcePath: '/xsct', rssUrl: rss('can-tho-xsct'), aliases: ['Cần Thơ'] },
  { code: 'xsld', name: 'Xổ số Lâm Đồng', shortName: 'XSLD', region: 'south', scheme: 'southCentral', sourcePath: '/xsld-xsdl', rssUrl: rss('lam-dong-xsld'), aliases: ['Lâm Đồng', 'Đà Lạt', 'Đà Lạt- Lâm Đồng', 'XSDL'], slugAliases: ['xsdl', 'xsld-xsdl'] },
  { code: 'xsdn', name: 'Xổ số Đồng Nai', shortName: 'XSDN', region: 'south', scheme: 'southCentral', sourcePath: '/xsdn', rssUrl: rss('dong-nai-xsdn'), aliases: ['Đồng Nai'] },
  { code: 'xsdt', name: 'Xổ số Đồng Tháp', shortName: 'XSDT', region: 'south', scheme: 'southCentral', sourcePath: '/xsdt', rssUrl: rss('dong-thap-xsdt'), aliases: ['Đồng Tháp'] },
  { code: 'xstg', name: 'Xổ số Tiền Giang', shortName: 'XSTG', region: 'south', scheme: 'southCentral', sourcePath: '/xstg', rssUrl: rss('tien-giang-xstg'), aliases: ['Tiền Giang'] },
  { code: 'xstn', name: 'Xổ số Tây Ninh', shortName: 'XSTN', region: 'south', scheme: 'southCentral', sourcePath: '/xstn', rssUrl: rss('tay-ninh-xstn'), aliases: ['Tây Ninh'] },
  { code: 'xsvl', name: 'Xổ số Vĩnh Long', shortName: 'XSVL', region: 'south', scheme: 'southCentral', sourcePath: '/xsvl', rssUrl: rss('vinh-long-xsvl'), aliases: ['Vĩnh Long'] },
  { code: 'xsbd', name: 'Xổ số Bình Dương', shortName: 'XSBD', region: 'south', scheme: 'southCentral', sourcePath: '/xsbd', rssUrl: rss('binh-duong-xsbd'), aliases: ['Bình Dương'], slugAliases: ['xsbdu'] },
  { code: 'xsbl', name: 'Xổ số Bạc Liêu', shortName: 'XSBL', region: 'south', scheme: 'southCentral', sourcePath: '/xsbl', rssUrl: rss('bac-lieu-xsbl'), aliases: ['Bạc Liêu'] },
  { code: 'xsbp', name: 'Xổ số Bình Phước', shortName: 'XSBP', region: 'south', scheme: 'southCentral', sourcePath: '/xsbp', rssUrl: rss('binh-phuoc-xsbp'), aliases: ['Bình Phước'] },
  { code: 'xsbt', name: 'Xổ số Bến Tre', shortName: 'XSBT', region: 'south', scheme: 'southCentral', sourcePath: '/xsbt', rssUrl: rss('ben-tre-xsbt'), aliases: ['Bến Tre'] },
  { code: 'xsbth', name: 'Xổ số Bình Thuận', shortName: 'XSBTH', region: 'south', scheme: 'southCentral', sourcePath: '/xsbth', rssUrl: rss('binh-thuan-xsbth'), aliases: ['Bình Thuận'] },
  { code: 'xshcm', name: 'Xổ số Hồ Chí Minh', shortName: 'XSHCM', region: 'south', scheme: 'southCentral', sourcePath: '/xshcm-xstp', rssUrl: rss('ho-chi-minh-xshcm'), aliases: ['Hồ Chí Minh', 'TP Hồ Chí Minh', 'TP. Hồ Chí Minh', 'XSTP'], slugAliases: ['xstp', 'xshcm-xstp'] },
  { code: 'xshg', name: 'Xổ số Hậu Giang', shortName: 'XSHG', region: 'south', scheme: 'southCentral', sourcePath: '/xshg', rssUrl: rss('hau-giang-xshg'), aliases: ['Hậu Giang'] },
  { code: 'xskg', name: 'Xổ số Kiên Giang', shortName: 'XSKG', region: 'south', scheme: 'southCentral', sourcePath: '/xskg', rssUrl: rss('kien-giang-xskg'), aliases: ['Kiên Giang'] },
  { code: 'xsla', name: 'Xổ số Long An', shortName: 'XSLA', region: 'south', scheme: 'southCentral', sourcePath: '/xsla', rssUrl: rss('long-an-xsla'), aliases: ['Long An'] },
  { code: 'xsst', name: 'Xổ số Sóc Trăng', shortName: 'XSST', region: 'south', scheme: 'southCentral', sourcePath: '/xsst', rssUrl: rss('soc-trang-xsst'), aliases: ['Sóc Trăng'], slugAliases: ['xsstr'] },
  { code: 'xstv', name: 'Xổ số Trà Vinh', shortName: 'XSTV', region: 'south', scheme: 'southCentral', sourcePath: '/xstv', rssUrl: rss('tra-vinh-xstv'), aliases: ['Trà Vinh'] },
  { code: 'xsvt', name: 'Xổ số Vũng Tàu', shortName: 'XSVT', region: 'south', scheme: 'southCentral', sourcePath: '/xsvt', rssUrl: rss('vung-tau-xsvt'), aliases: ['Vũng Tàu'] },

  // Miền Trung
  { code: 'xsbdi', name: 'Xổ số Bình Định', shortName: 'XSBDI', region: 'central', scheme: 'southCentral', sourcePath: '/xsbdi', rssUrl: rss('binh-dinh-xsbdi'), aliases: ['Bình Định'], slugAliases: ['xsbdinh'] },
  { code: 'xsdlk', name: 'Xổ số Đắk Lắk', shortName: 'XSDLK', region: 'central', scheme: 'southCentral', sourcePath: '/xsdlk', rssUrl: rss('dak-lak-xsdlk'), aliases: ['Đắk Lắk', 'Đắc Lắc'] },
  { code: 'xsdng', name: 'Xổ số Đà Nẵng', shortName: 'XSDNG', region: 'central', scheme: 'southCentral', sourcePath: '/xsdng', rssUrl: rss('da-nang-xsdng'), aliases: ['Đà Nẵng'] },
  { code: 'xsdno', name: 'Xổ số Đắk Nông', shortName: 'XSDNO', region: 'central', scheme: 'southCentral', sourcePath: '/xsdno', rssUrl: rss('dak-nong-xsdno'), aliases: ['Đắk Nông', 'Đắc Nông'] },
  { code: 'xsgl', name: 'Xổ số Gia Lai', shortName: 'XSGL', region: 'central', scheme: 'southCentral', sourcePath: '/xsgl', rssUrl: rss('gia-lai-xsgl'), aliases: ['Gia Lai'] },
  { code: 'xskh', name: 'Xổ số Khánh Hòa', shortName: 'XSKH', region: 'central', scheme: 'southCentral', sourcePath: '/xskh', rssUrl: rss('khanh-hoa-xskh'), aliases: ['Khánh Hòa'] },
  { code: 'xskt', name: 'Xổ số Kon Tum', shortName: 'XSKT', region: 'central', scheme: 'southCentral', sourcePath: '/xskt', rssUrl: rss('kon-tum-xskt'), aliases: ['Kon Tum'] },
  { code: 'xsnt', name: 'Xổ số Ninh Thuận', shortName: 'XSNT', region: 'central', scheme: 'southCentral', sourcePath: '/xsnt', rssUrl: rss('ninh-thuan-xsnt'), aliases: ['Ninh Thuận'] },
  { code: 'xspy', name: 'Xổ số Phú Yên', shortName: 'XSPY', region: 'central', scheme: 'southCentral', sourcePath: '/xspy', rssUrl: rss('phu-yen-xspy'), aliases: ['Phú Yên'] },
  { code: 'xsqb', name: 'Xổ số Quảng Bình', shortName: 'XSQB', region: 'central', scheme: 'southCentral', sourcePath: '/xsqb', rssUrl: rss('quang-binh-xsqb'), aliases: ['Quảng Bình'] },
  { code: 'xsqng', name: 'Xổ số Quảng Ngãi', shortName: 'XSQNG', region: 'central', scheme: 'southCentral', sourcePath: '/xsqng', rssUrl: rss('quang-ngai-xsqng'), aliases: ['Quảng Ngãi'] },
  { code: 'xsqnm', name: 'Xổ số Quảng Nam', shortName: 'XSQNM', region: 'central', scheme: 'southCentral', sourcePath: '/xsqnm-xsqna', rssUrl: rss('quang-nam-xsqnm'), aliases: ['Quảng Nam', 'XSQNA'], slugAliases: ['xsqna', 'xsqnm-xsqna'] },
  { code: 'xsqt', name: 'Xổ số Quảng Trị', shortName: 'XSQT', region: 'central', scheme: 'southCentral', sourcePath: '/xsqt', rssUrl: rss('quang-tri-xsqt'), aliases: ['Quảng Trị'] },
  { code: 'xstth', name: 'Xổ số Thừa Thiên Huế', shortName: 'XSTTH', region: 'central', scheme: 'southCentral', sourcePath: '/xstth', rssUrl: rss('thua-thien-hue-xstth'), aliases: ['Thừa Thiên Huế', 'Thành phố Huế', 'Huế', 'XSH'] }
];

const byCode = new Map(LOTTERY_SOURCES.map((item) => [item.code, item]));
const bySlugAlias = new Map(
  LOTTERY_SOURCES.flatMap((item) => {
    const sourceSlug = item.sourcePath?.replace(/^\//, '').split('/')[0];
    return [...(item.slugAliases || []), ...(sourceSlug && sourceSlug !== item.code ? [sourceSlug] : [])].map(
      (alias) => [alias, item] as const
    );
  })
);

export function getLotterySource(code = 'xsmb') {
  const normalizedCode = code.toLowerCase();
  return byCode.get(normalizedCode) || bySlugAlias.get(normalizedCode) || null;
}

export function getAllLotterySources() {
  return LOTTERY_SOURCES;
}

export function getSourcesByRegion(region: LotterySourceConfig['region']) {
  return LOTTERY_SOURCES.filter((item) => item.region === region);
}
