export const siteConfig = {
  name: 'XoSoMB.vn',
  domain: 'xosomb.vn',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://xosomb.vn',
  description:
    'XoSoMB.vn tra cứu XSMB hôm nay, kết quả xổ số miền Bắc, miền Nam, miền Trung và Vietlott nhanh, rõ ràng, có sổ kết quả theo ngày.'
};

export function absoluteUrl(path = '/') {
  const base = siteConfig.url.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
