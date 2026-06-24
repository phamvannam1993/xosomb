import type { LotterySourceConfig } from './types';
import { absoluteXsktUrl, normalizeForCompare, stripHtml } from './text';
import { XSKT_BASE_URL } from './catalog';
import { fetchWithTimeout, numberFromEnv } from '@/lib/fetch-utils';

const rssUrlCache = new Map<string, string | null>();
const pageUrlCache = new Map<string, string | null>();
let rssIndexHtmlCache: string | null = null;

async function fetchXsktIndexHtml() {
  if (rssIndexHtmlCache) return rssIndexHtmlCache;
  const timeoutMs = numberFromEnv(['LOTTERY_DISCOVERY_TIMEOUT_MS', 'LOTTERY_FETCH_TIMEOUT_MS'], 5000);
  const response = await fetchWithTimeout(`${XSKT_BASE_URL}/rss`, {
    headers: { 'User-Agent': 'xosomb.vn data fetcher/1.0' },
    next: { revalidate: 3600 }
  }, timeoutMs);
  if (!response.ok) throw new Error(`Không lấy được trang RSS XSKT: ${response.status}`);
  rssIndexHtmlCache = await response.text();
  return rssIndexHtmlCache;
}

function extractAnchors(html: string) {
  const anchors: Array<{ href: string; text: string }> = [];
  const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(regex)) {
    anchors.push({ href: match[1], text: stripHtml(match[2]) });
  }
  return anchors;
}

function candidateNames(source: LotterySourceConfig) {
  return [source.rssTitle, source.name, source.shortName, ...(source.aliases || [])]
    .filter(Boolean)
    .map((value) => normalizeForCompare(String(value)));
}

function isMatchingAnchor(anchorText: string, source: LotterySourceConfig) {
  const normalized = normalizeForCompare(anchorText);
  return candidateNames(source).some((candidate) => candidate && (normalized.includes(candidate) || candidate.includes(normalized)));
}

function envRssUrlForSource(source: LotterySourceConfig) {
  const codeKey = `${source.code.toUpperCase()}_RSS_URL`;
  const regionKey = `LOTTERY_RSS_URL_${source.region.toUpperCase()}`;

  return (
    process.env[codeKey] ||
    process.env[regionKey] ||
    process.env.LOTTERY_RSS_URL ||
    source.rssUrl ||
    null
  );
}

export async function discoverRssUrl(source: LotterySourceConfig): Promise<string | null> {
  const configuredUrl = envRssUrlForSource(source);
  if (configuredUrl) return configuredUrl;
  if (rssUrlCache.has(source.code)) return rssUrlCache.get(source.code) || null;

  try {
    const html = await fetchXsktIndexHtml();
    const anchors = extractAnchors(html);
    const matched = anchors.find((anchor) => /rss-feed\//i.test(anchor.href) && isMatchingAnchor(anchor.text, source));
    const url = matched ? absoluteXsktUrl(matched.href, XSKT_BASE_URL) : null;
    rssUrlCache.set(source.code, url);
    return url;
  } catch {
    rssUrlCache.set(source.code, null);
    return null;
  }
}

export async function discoverPageUrl(source: LotterySourceConfig): Promise<string | null> {
  if (source.sourcePath) return absoluteXsktUrl(source.sourcePath, XSKT_BASE_URL);
  if (pageUrlCache.has(source.code)) return pageUrlCache.get(source.code) || null;

  try {
    const html = await fetchXsktIndexHtml();
    const anchors = extractAnchors(html);
    const matched = anchors.find((anchor) => !/rss-feed\//i.test(anchor.href) && isMatchingAnchor(anchor.text, source));
    const discoveredUrl = matched ? absoluteXsktUrl(matched.href, XSKT_BASE_URL) : null;
    const fallbackUrl = `${XSKT_BASE_URL}/${source.shortName.toLowerCase()}`;
    const url = discoveredUrl || fallbackUrl;
    pageUrlCache.set(source.code, url);
    return url;
  } catch {
    const fallbackUrl = `${XSKT_BASE_URL}/${source.shortName.toLowerCase()}`;
    pageUrlCache.set(source.code, fallbackUrl);
    return fallbackUrl;
  }
}
