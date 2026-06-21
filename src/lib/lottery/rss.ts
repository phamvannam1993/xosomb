import type { LotteryLiveResult, LotteryResult, LotterySourceConfig } from './types';
import { normalizeLiveResultFromText, normalizeResultFromText } from './normalize';
import { normalizeDateFromPubDate, normalizeDateFromText } from './format';
import { stripHtml } from './text';
import { discoverRssUrl } from './discovery';

export type RssItem = {
  title: string;
  description: string;
  link?: string;
  pubDate?: string;
};

type RssFetchOptions = {
  noStore?: boolean;
  revalidateSeconds?: number;
};

function getTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return '';
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseRssItems(xml: string): RssItem[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  return blocks.map((block) => ({
    title: stripHtml(getTag(block, 'title')),
    description: getTag(block, 'description'),
    link: stripHtml(getTag(block, 'link')) || undefined,
    pubDate: stripHtml(getTag(block, 'pubDate')) || undefined
  }));
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

  const response = await fetch(rssUrl, {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      'User-Agent': 'xosomb.vn data fetcher/1.0'
    },
    ...(options.noStore
      ? { cache: 'no-store' as const }
      : {
          next: {
            revalidate: Number(
              options.revalidateSeconds || process.env.LOTTERY_REVALIDATE_SECONDS || process.env.XSMB_REVALIDATE_SECONDS || 60
            )
          }
        })
  });

  if (!response.ok) throw new Error(`Không lấy được RSS ${source.shortName}: ${response.status}`);

  return { rssUrl, xml: await response.text() };
}

function dedupeCompleteResults(results: LotteryResult[]) {
  return Array.from(new Map(results.map((result) => [result.date, result])).values())
    .sort((a, b) => b.date.localeCompare(a.date));
}

function pickBestLiveResult(results: LotteryLiveResult[]) {
  return results.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    if (a.completenessScore !== b.completenessScore) return b.completenessScore - a.completenessScore;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  })[0] || null;
}

export async function fetchLotteryFromRss(source: LotterySourceConfig, options: RssFetchOptions = {}): Promise<LotteryResult[]> {
  const { rssUrl, xml } = await fetchRssXml(source, options);
  if (!rssUrl || !xml) return [];

  const results = parseRssItems(xml)
    .map((item) => normalizeRssItem(item, source, rssUrl))
    .filter((result): result is LotteryResult => Boolean(result));

  return dedupeCompleteResults(results);
}

export async function fetchLiveLotteryFromRss(
  source: LotterySourceConfig,
  date?: string,
  options: RssFetchOptions = {}
): Promise<LotteryLiveResult | null> {
  const { rssUrl, xml } = await fetchRssXml(source, { ...options, noStore: options.noStore ?? true });
  if (!rssUrl || !xml) return null;

  const results = parseRssItems(xml)
    .map((item) => normalizeLiveRssItem(item, source, rssUrl))
    .filter((result): result is LotteryLiveResult => Boolean(result))
    .filter((result) => !date || result.date === date);

  return pickBestLiveResult(results);
}
