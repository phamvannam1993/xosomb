export const siteConfig = {
  name: 'XoSoMB.vn',
  domain: 'xosomb.vn',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://xosomb.vn',
  description:
    'Tra cứu kết quả xổ số nhanh, rõ ràng, có dữ liệu theo ngày, bảng lô tô 2 số cuối và thống kê tham khảo.'
};

export function absoluteUrl(path = '/') {
  const base = siteConfig.url.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
