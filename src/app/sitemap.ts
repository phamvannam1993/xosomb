import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site';
import { todayInVietnam } from '@/lib/lottery/format';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const today = todayInVietnam();

  // Tính ngày 30 ngày trước
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const dateRange: string[] = [];
  const currentDate = new Date(thirtyDaysAgo);
  const endDate = new Date(today);

  while (currentDate <= endDate) {
    dateRange.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Tất cả lottery types
  const lotteryTypes = [
    { code: 'xsmb', name: 'XSMB' },
    { code: 'xsmn', name: 'XSMN' },
    { code: 'xsmt', name: 'XSMT' }
  ];

  // Vietlott products
  const vietlottProducts = [
    'mega-645',
    'power-655',
    'max-3d',
    'max-3d-pro'
  ];

  const entries: MetadataRoute.Sitemap = [
    // Trang chủ
    {
      url: baseUrl,
      lastModified: today,
      changeFrequency: 'hourly',
      priority: 1.0
    },

    // Trang chính lottery
    ...lotteryTypes.map(lottery => ({
      url: `${baseUrl}/${lottery.code}`,
      lastModified: today,
      changeFrequency: 'hourly' as const,
      priority: 0.9
    })),

    // Trang ngày của lottery (30 ngày gần đây)
    ...lotteryTypes.flatMap(lottery =>
      dateRange.map(date => ({
        url: `${baseUrl}/${lottery.code}/${date}`,
        lastModified: date,
        changeFrequency: 'daily' as const,
        priority: 0.8
      }))
    ),

    // Trang chính Vietlott
    {
      url: `${baseUrl}/vietlott`,
      lastModified: today,
      changeFrequency: 'daily' as const,
      priority: 0.8
    },

    // Trang sản phẩm Vietlott
    ...vietlottProducts.map(product => ({
      url: `${baseUrl}/vietlott/${product}`,
      lastModified: today,
      changeFrequency: 'hourly' as const,
      priority: 0.8
    })),

    // Trang ngày của Vietlott (30 ngày gần đây)
    ...vietlottProducts.flatMap(product =>
      dateRange.map(date => ({
        url: `${baseUrl}/vietlott/${product}/${date}`,
        lastModified: date,
        changeFrequency: 'daily' as const,
        priority: 0.7
      }))
    ),

    // Trang tiện ích
    {
      url: `${baseUrl}/xsmb-30-ngay`,
      lastModified: today,
      changeFrequency: 'daily' as const,
      priority: 0.7
    },
    {
      url: `${baseUrl}/thong-ke`,
      lastModified: today,
      changeFrequency: 'daily' as const,
      priority: 0.7
    },
    {
      url: `${baseUrl}/lich-mo-thuong`,
      lastModified: today,
      changeFrequency: 'weekly' as const,
      priority: 0.6
    },
    {
      url: `${baseUrl}/quay-thu-xsmb`,
      lastModified: today,
      changeFrequency: 'weekly' as const,
      priority: 0.5
    },
    {
      url: `${baseUrl}/quay-thu-xsmn`,
      lastModified: today,
      changeFrequency: 'weekly' as const,
      priority: 0.5
    },
    {
      url: `${baseUrl}/quay-thu-xsmt`,
      lastModified: today,
      changeFrequency: 'weekly' as const,
      priority: 0.5
    }
  ];

  return entries;
}
