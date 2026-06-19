import type { LotteryResult, LotterySourceConfig } from './types';
import { normalizeResultFromText } from './normalize';
import { normalizeDateFromPubDate, normalizeDateFromText } from './format';
import { stripHtml } from './text';
import { discoverRssUrl } from './discovery';

export type RssItem = {
  title: string;
  description: string;
  link?: string;
  pubDate?: string;
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

function normalizeRssItem(item: RssItem, source: LotterySourceConfig, fallbackSourceUrl?: string): LotteryResult | null {
  const cleanDescription = stripHtml(item.description);
  const combinedText = `${item.title} ${cleanDescription}`;
  const date = normalizeDateFromText(combinedText) || normalizeDateFromPubDate(item.pubDate);

  return normalizeResultFromText(cleanDescription.length > 30 ? cleanDescription : combinedText, source, {
    date: date || undefined,
    sourceUrl: item.link || fallbackSourceUrl,
    sourceName: process.env.LOTTERY_RSS_SOURCE_NAME || process.env.XSMB_RSS_SOURCE_NAME || 'XSKT RSS',
    updatedAt: item.pubDate,
    dataSource: 'rss'
  });
}

export async function fetchLotteryFromRss(source: LotterySourceConfig): Promise<LotteryResult[]> {
  const rssUrl = await discoverRssUrl(source);
  if (!rssUrl) return [];

  const response = await fetch(rssUrl, {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      'User-Agent': 'xosomb.vn data fetcher/1.0'
    },
    next: { revalidate: Number(process.env.LOTTERY_REVALIDATE_SECONDS || process.env.XSMB_REVALIDATE_SECONDS || 60) }
  });

  if (!response.ok) throw new Error(`Không lấy được RSS ${source.shortName}: ${response.status}`);

  const xml = await response.text();
  const results = parseRssItems(xml)
    .map((item) => normalizeRssItem(item, source, rssUrl))
    .filter((result): result is LotteryResult => Boolean(result));

  return Array.from(new Map(results.map((result) => [result.date, result])).values())
    .sort((a, b) => b.date.localeCompare(a.date));
}
