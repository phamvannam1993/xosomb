const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const secret = process.env.CACHE_WARM_SECRET || process.env.CRON_SECRET || process.env.WARM_CACHE_SECRET || '';
const url = new URL('/api/cron/warm-cache', siteUrl);

url.searchParams.set('scope', process.env.WARM_CACHE_SCOPE || process.env.CACHE_WARM_SCOPE || 'core');
url.searchParams.set('limit', process.env.WARM_CACHE_LIMIT || process.env.CACHE_WARM_LIMIT || '7');

if (process.env.WARM_CACHE_LIVE === 'true' || process.env.WARM_CACHE_LIVE === '1') {
  url.searchParams.set('live', '1');
}

if (process.env.WARM_CACHE_CODES) {
  url.searchParams.set('codes', process.env.WARM_CACHE_CODES);
}

if (process.env.WARM_CACHE_PRODUCTS) {
  url.searchParams.set('products', process.env.WARM_CACHE_PRODUCTS);
}

if (process.env.WARM_CACHE_CONCURRENCY) {
  url.searchParams.set('concurrency', process.env.WARM_CACHE_CONCURRENCY);
}

const headers = secret ? { Authorization: `Bearer ${secret}` } : {};
const response = await fetch(url, { headers, cache: 'no-store' });
const text = await response.text();

try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text);
}

if (!response.ok && response.status !== 207) {
  process.exitCode = 1;
}
