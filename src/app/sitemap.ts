import type { MetadataRoute } from 'next';
import { getAllLotterySources } from '@/lib/lottery/catalog';
import { getRecentLotteryResults } from '@/lib/lottery/provider';
import { absoluteUrl } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sources = getAllLotterySources().slice(0, 40);
  const recent = await getRecentLotteryResults('xsmb');
  const xsdtRecent = await getRecentLotteryResults('xsdt').catch(() => []);

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/xsmb'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: absoluteUrl('/xsmb-30-ngay'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.86 },
    { url: absoluteUrl('/thong-ke'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: absoluteUrl('/lich-mo-thuong'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.64 },
    ...sources.map((source) => ({
      url: absoluteUrl(`/${source.code}`),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: source.code === 'xsmb' ? 0.95 : 0.72
    }))
  ];

  const datePages = [...recent, ...xsdtRecent].map((result) => ({
    url: absoluteUrl(`/${result.code}/${result.date}`),
    lastModified: new Date(result.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.82
  }));

  return [...staticPages, ...datePages];
}
