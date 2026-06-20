import type { VietlottProductConfig, VietlottProductId } from './types';

export const VIETLOTT_BASE_URL = 'https://xskt.com.vn';

export const VIETLOTT_PRODUCTS: VietlottProductConfig[] = [
  {
    id: 'mega-645',
    name: 'Xổ số Mega 6/45',
    shortName: 'Mega 6/45',
    xsktPath: '/xsmega645',
    aliases: ['mega', 'mega645', 'xsmega', 'xsmega645'],
    schedule: 'Mở thưởng lúc 18h00 các ngày thứ Tư, thứ Sáu và Chủ Nhật hằng tuần.',
    description: 'Tra cứu kết quả Vietlott Mega 6/45 mới nhất, dãy số trúng thưởng và thống kê giải.'
  },
  {
    id: 'power-655',
    name: 'Xổ số Power 6/55',
    shortName: 'Power 6/55',
    xsktPath: '/xspower',
    aliases: ['power', 'power655', 'xspower'],
    schedule: 'Mở thưởng lúc 18h00 các ngày thứ Ba, thứ Năm và thứ Bảy hằng tuần.',
    description: 'Tra cứu kết quả Vietlott Power 6/55 mới nhất, dãy số trúng thưởng, số JP2 và thống kê giải.'
  },
  {
    id: 'max-3d',
    name: 'Xổ số Max 3D',
    shortName: 'Max 3D',
    xsktPath: '/xsmax3d',
    aliases: ['max3d', 'xsmax3d'],
    schedule: 'Mở thưởng lúc 18h00 các ngày thứ Hai, thứ Tư và thứ Sáu hằng tuần.',
    description: 'Tra cứu kết quả Vietlott Max 3D mới nhất theo từng hạng giải.'
  },
  {
    id: 'max-3d-pro',
    name: 'Xổ số Max 3D Pro',
    shortName: 'Max 3D Pro',
    xsktPath: '/xsmax3dpro',
    aliases: ['max3dpro', 'xsmax3dpro', 'max-3dplus', 'max3d-plus'],
    schedule: 'Mở thưởng lúc 18h00 các ngày thứ Ba, thứ Năm và thứ Bảy hằng tuần.',
    description: 'Tra cứu kết quả Vietlott Max 3D Pro mới nhất theo từng hạng giải.'
  }
];

const byId = new Map(VIETLOTT_PRODUCTS.map((item) => [item.id, item]));
const byAlias = new Map(
  VIETLOTT_PRODUCTS.flatMap((item) => item.aliases.map((alias) => [alias, item] as const))
);

export function getVietlottProduct(product?: string | null) {
  const normalized = (product || 'mega-645').toLowerCase() as VietlottProductId;
  return byId.get(normalized) || byAlias.get(normalized) || null;
}

export function getAllVietlottProducts() {
  return VIETLOTT_PRODUCTS;
}

export function buildVietlottUrl(product: VietlottProductConfig, date?: string) {
  const base = `${VIETLOTT_BASE_URL}${product.xsktPath}`;
  if (!date) return base;
  const [year, month, day] = date.split('-').map(Number);
  return `${base}/ngay-${day}-${month}-${year}`;
}

export function buildVietlottRecentUrl(product: VietlottProductConfig) {
  return `${VIETLOTT_BASE_URL}${product.xsktPath}/30-ngay`;
}
