import type { LotteryLiveResult, LotteryResult, LotterySourceConfig } from './types';
import { normalizeLiveResultFromText, normalizeResultFromText, pickBetterLiveResult } from './normalize';
import { normalizeDateFromPubDate, normalizeDateFromText } from './format';
import { stripHtml, xmlEntityDecode } from './text';
import { discoverRssUrl } from './discovery';
import { cacheBustUrl, fetchWithTimeout, numberFromEnv } from '@/lib/fetch-utils';

export type RssItem = {
  title: string;
  description: string;
  content?: string;
  link?: string;
  pubDate?: string;
};

type RssFetchOptions = {
  noStore?: boolean;
  cacheBust?: boolean;
  revalidateSeconds?: number;
};

type LiveRssCacheEntry = {
  expiresAt: number;
  promise: Promise<LotteryLiveResult | null>;
};

const liveRssCache = new Map<string, LiveRssCacheEntry>();

function getTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? xmlEntityDecode(match[1]).trim() : '';
}

function getItemLink(block: string) {
  const textLink = stripHtml(getTag(block, 'link'));
  if (textLink) return textLink;

  const atomLink = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i)?.[1];
  return atomLink ? xmlEntityDecode(atomLink).trim() : '';
}

function richestContent(...values: string[]) {
  return values
    .filter(Boolean)
    .sort((left, right) => stripHtml(right).length - stripHtml(left).length)[0] || '';
}

export function parseRssItems(xml: string): RssItem[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];

  return blocks.map((block) => {
    const description = getTag(block, 'description');
    const encodedContent = getTag(block, 'content:encoded');
    const atomSummary = getTag(block, 'summary');
    const atomContent = getTag(block, 'content');

    return {
      title: stripHtml(getTag(block, 'title')),
      description: richestContent(description, encodedContent, atomSummary, atomContent),
      content: encodedContent || atomContent || undefined,
      link: getItemLink(block) || undefined,
      pubDate: stripHtml(getTag(block, 'pubDate') || getTag(block, 'updated') || getTag(block, 'published')) || undefined
    };
  });
}

function sourceName() {
  return process.env.LOTTERY_RSS_SOURCE_NAME || process.env.XSMB_RSS_SOURCE_NAME || 'XSKT RSS';
}

function itemDate(item: RssItem) {
  const cleanDescription = stripHtml(item.description);
  const combinedText = `${item.title} ${cleanDescription}`;
  return normalizeDateFromText(combinedText) || normalizeDateFromPubDate(item.pubDate);
}

function normalizeRssItem(item: RssItem, source: LotterySourceConfig, fallbackSourceUrl?: string): LotteryResult | null {
  const cleanDescription = stripHtml(item.description);
  const combinedText = `${item.title} ${cleanDescription}`;
  const date = itemDate(item);

  return normalizeResultFromText(cleanDescription.length > 30 ? cleanDescription : combinedText, source, {
    date: date || undefined,
    sourceUrl: item.link || fallbackSourceUrl,
    sourceName: sourceName(),
    updatedAt: item.pubDate,
    dataSource: 'rss'
  });
}

function normalizeLiveRssItem(item: RssItem, source: LotterySourceConfig, fallbackSourceUrl?: string): LotteryLiveResult | null {
  const cleanDescription = stripHtml(item.description);
  const combinedText = `${item.title} ${cleanDescription}`;
  const date = itemDate(item);

  return normalizeLiveResultFromText(cleanDescription.length > 30 ? cleanDescription : combinedText, source, {
    date: date || undefined,
    sourceUrl: item.link || fallbackSourceUrl,
    sourceName: sourceName(),
    updatedAt: item.pubDate,
    dataSource: 'rss'
  });
}

async function fetchRssXml(source: LotterySourceConfig, options: RssFetchOptions = {}) {
  const rssUrl = await discoverRssUrl(source);
  if (!rssUrl) return { rssUrl: null, xml: null };

  const timeoutMs = numberFromEnv(['LOTTERY_RSS_TIMEOUT_MS', 'XSMB_RSS_TIMEOUT_MS', 'LOTTERY_FETCH_TIMEOUT_MS'], 5000);
  const liveBucketMs = numberFromEnv(['LOTTERY_LIVE_UPSTREAM_CACHE_MS', 'XSMB_LIVE_UPSTREAM_CACHE_MS'], 2000);
  const shouldBustCache = options.cacheBust ?? options.noStore ?? false;
  const requestUrl = shouldBustCache ? cacheBustUrl(rssUrl, '_live', liveBucketMs) : rssUrl;

  const response = await fetchWithTimeout(
    requestUrl,
    {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        'User-Agent': 'xosomb.vn data fetcher/1.1',
        ...(options.noStore || shouldBustCache
          ? { 'Cache-Control': 'no-cache, no-store, max-age=0', Pragma: 'no-cache' }
          : {})
      },
      redirect: 'follow',
      ...(options.noStore
        ? { cache: 'no-store' as const }
        : {
            next: {
              revalidate: Number(
                options.revalidateSeconds || process.env.LOTTERY_REVALIDATE_SECONDS || process.env.XSMB_REVALIDATE_SECONDS || 60
              )
            }
          })
    },
    timeoutMs
  );

  if (!response.ok) throw new Error(`Không lấy được RSS ${source.shortName}: ${response.status}`);

  return { rssUrl, xml: await response.text() };
}

function dedupeCompleteResults(results: LotteryResult[]) {
  return Array.from(new Map(results.map((result) => [result.date, result])).values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

function pickBestLiveResult(results: LotteryLiveResult[]) {
  return results.reduce<LotteryLiveResult | null>((best, result) => pickBetterLiveResult(best, result), null);
}

export async function fetchLotteryFromRss(source: LotterySourceConfig, options: RssFetchOptions = {}): Promise<LotteryResult[]> {
  const { rssUrl, xml } = await fetchRssXml(source, options);
  if (!rssUrl || !xml) return [];

  const results = parseRssItems(xml)
    .map((item) => normalizeRssItem(item, source, rssUrl))
    .filter((result): result is LotteryResult => Boolean(result));

  return dedupeCompleteResults(results);
}

async function fetchLiveLotteryFromRssUncached(
  source: LotterySourceConfig,
  date?: string,
  options: RssFetchOptions = {}
): Promise<LotteryLiveResult | null> {
  const { rssUrl, xml } = await fetchRssXml(source, {
    ...options,
    noStore: options.noStore ?? true,
    cacheBust: options.cacheBust ?? true
  });
  if (!rssUrl || !xml) return null;

  const results = parseRssItems(xml)
    .map((item) => normalizeLiveRssItem(item, source, rssUrl))
    .filter((result): result is LotteryLiveResult => Boolean(result))
    .filter((result) => !date || result.date === date);

  return pickBestLiveResult(results);
}

export async function fetchLiveLotteryFromRss(
  source: LotterySourceConfig,
  date?: string,
  options: RssFetchOptions = {}
): Promise<LotteryLiveResult | null> {
  if (options.noStore === false) return fetchLiveLotteryFromRssUncached(source, date, options);

  // Gộp các request đồng thời trong một khoảng rất ngắn để tránh nhiều client cùng đánh vào RSS,
  // nhưng mỗi vòng polling sau vẫn nhận URL phá cache mới.
  const cacheMs = numberFromEnv(['LOTTERY_LIVE_UPSTREAM_CACHE_MS', 'XSMB_LIVE_UPSTREAM_CACHE_MS'], 2000);
  const cacheKey = `${source.code}:${date || 'latest'}`;
  const now = Date.now();
  const cached = liveRssCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.promise;

  const promise = fetchLiveLotteryFromRssUncached(source, date, {
    ...options,
    noStore: true,
    cacheBust: options.cacheBust ?? true
  }).catch((error) => {
    liveRssCache.delete(cacheKey);
    throw error;
  });

  liveRssCache.set(cacheKey, { expiresAt: now + cacheMs, promise });
  return promise;
}
