import type { MetadataRoute } from 'next';
import { getAllLotterySources } from '@/lib/lottery/catalog';
import { readRecentCachedResults } from '@/lib/lottery/cache';
import { getResultDisplayUpdatedAt, todayInVietnam } from '@/lib/lottery/format';
import { getAllVietlottProducts } from '@/lib/vietlott/catalog';
import { readRecentCachedVietlottResults } from '@/lib/vietlott/cache';
import { siteConfig } from '@/lib/site';

function entry(path: string, lastModified: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']): MetadataRoute.Sitemap[number] {
  const baseUrl = siteConfig.url.replace(/\/$/, '');
  return {
    url: path === '/' ? baseUrl : `${baseUrl}${path}`,
    lastModified,
    changeFrequency,
    priority
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = todayInVietnam();
  const lotterySources = getAllLotterySources();
  const vietlottProducts = getAllVietlottProducts();

  const staticEntries: MetadataRoute.Sitemap = [
    entry('/', today, 1.0, 'hourly'),
    entry('/xsmb-30-ngay', today, 0.7, 'daily'),
    entry('/do-ve-so', today, 0.75, 'weekly'),
    entry('/in-ve-do', today, 0.72, 'weekly'),
    entry('/gioi-thieu', today, 0.55, 'monthly'),
    entry('/nguon-du-lieu', today, 0.6, 'monthly'),
    entry('/chinh-sach-cap-nhat-ket-qua', today, 0.6, 'monthly'),
    entry('/mien-tru-trach-nhiem', today, 0.5, 'monthly'),
    entry('/lien-he', today, 0.5, 'monthly'),
    entry('/thong-ke', today, 0.7, 'daily'),
    entry('/thong-ke-tan-suat-lo-to-mien-bac.html', today, 0.8, 'daily'),
    entry('/lich-mo-thuong', today, 0.6, 'weekly'),
    entry('/vietlott', today, 0.8, 'daily')
  ];

  const lotteryMainEntries = lotterySources.map((source) =>
    entry(
      `/${source.code}`,
      today,
      source.code === 'xsmb' ? 0.9 : source.code === 'xsmn' || source.code === 'xsmt' ? 0.85 : 0.75,
      'hourly'
    )
  );

  const lotteryDateEntries = (
    await Promise.all(
      lotterySources.map(async (source) => {
        const results = await readRecentCachedResults(source.code, 30);
        return results.map((result) =>
          entry(`/${source.code}/${result.date}`, getResultDisplayUpdatedAt(result) || result.date, 0.65, 'daily')
        );
      })
    )
  ).flat();

  const vietlottMainEntries = vietlottProducts.map((product) =>
    entry(`/vietlott/${product.id}`, today, 0.75, 'daily')
  );

  const vietlottDateEntries = (
    await Promise.all(
      vietlottProducts.map(async (product) => {
        const results = await readRecentCachedVietlottResults(product.id, 30);
        return results.map((result) => entry(`/vietlott/${product.id}/${result.date}`, result.updatedAt || result.date, 0.6, 'daily'));
      })
    )
  ).flat();

  const unique = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const item of [
    ...staticEntries,
    ...lotteryMainEntries,
    ...lotteryDateEntries,
    ...vietlottMainEntries,
    ...vietlottDateEntries
  ]) {
    unique.set(item.url, item);
  }

  return Array.from(unique.values());
}
