import type { MetadataRoute } from 'next';
import { getAllLotterySources } from '@/lib/lottery/catalog';
import { getRecentLotteryResults } from '@/lib/lottery/provider';
import { getAllVietlottProducts } from '@/lib/vietlott/catalog';
import { getRecentVietlottResults } from '@/lib/vietlott/provider';
import { absoluteUrl } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sources = getAllLotterySources().slice(0, 40);
  const recent = await getRecentLotteryResults('xsmb');
  const xsdtRecent = await getRecentLotteryResults('xsdt').catch(() => []);
  const vietlottProducts = getAllVietlottProducts();
  const vietlottRecent = (await Promise.all(
    vietlottProducts.map((product) => getRecentVietlottResults(product.id, 5).catch(() => []))
  )).flat();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/xsmb'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
    { url: absoluteUrl('/xsmb-30-ngay'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.86 },
    { url: absoluteUrl('/thong-ke'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: absoluteUrl('/lich-mo-thuong'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.64 },
    { url: absoluteUrl('/vietlott'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.82 },
    ...vietlottProducts.map((product) => ({
      url: absoluteUrl(`/vietlott/${product.id}`),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.78
    })),
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

  const vietlottDatePages = vietlottRecent.map((result) => ({
    url: absoluteUrl(`/vietlott/${result.product}/${result.date}`),
    lastModified: new Date(result.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.72
  }));

  return [...staticPages, ...datePages, ...vietlottDatePages];
}
