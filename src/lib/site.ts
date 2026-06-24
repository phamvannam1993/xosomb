const CANONICAL_DOMAIN = 'xosomb.vn';
const CANONICAL_URL = `https://${CANONICAL_DOMAIN}`;

function isLocalHostname(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname.endsWith('.local');
}

function normalizeSiteUrl(value?: string | null) {
  const rawValue = value?.trim();

  if (!rawValue) return CANONICAL_URL;

  try {
    const url = new URL(/^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`);
    const hostname = url.hostname.toLowerCase();

    // Production luôn chốt canonical về non-www để tránh Google index 2 bản.
    if (process.env.NODE_ENV === 'production') {
      if (hostname === CANONICAL_DOMAIN || hostname === `www.${CANONICAL_DOMAIN}` || isLocalHostname(hostname)) {
        return CANONICAL_URL;
      }
    }

    if (hostname === `www.${CANONICAL_DOMAIN}`) {
      url.hostname = CANONICAL_DOMAIN;
      url.protocol = 'https:';
    }

    if (hostname === CANONICAL_DOMAIN) {
      url.protocol = 'https:';
    }

    url.pathname = '';
    url.search = '';
    url.hash = '';

    return url.toString().replace(/\/$/, '');
  } catch {
    return CANONICAL_URL;
  }
}

export const siteConfig = {
  name: 'XoSoMB.vn',
  domain: CANONICAL_DOMAIN,
  canonicalHost: CANONICAL_DOMAIN,
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL),
  description:
    'XoSoMB.vn tra cứu XSMB hôm nay, kết quả xổ số miền Bắc, miền Nam, miền Trung và Vietlott nhanh, rõ ràng, có sổ kết quả theo ngày.'
};

export function absoluteUrl(path = '/') {
  const base = siteConfig.url.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
