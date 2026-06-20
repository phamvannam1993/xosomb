import type { Metadata } from 'next';
import { absoluteUrl, siteConfig } from './site';

interface MetadataOptions {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
}

export function generateDynamicMetadata(options: MetadataOptions): Metadata {
  const {
    title,
    description,
    canonicalPath = '/',
    ogImage = `${siteConfig.url}/og-image.png`
  } = options;

  const finalTitle = title ? `${title} | XoSoMB.vn` : siteConfig.name;
  const finalDescription = description || siteConfig.description;
  const canonicalUrl = absoluteUrl(canonicalPath);

  return {
    title: finalTitle,
    description: finalDescription,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      siteName: siteConfig.name,
      title: finalTitle,
      description: finalDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: finalTitle
        }
      ],
      locale: 'vi_VN'
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      images: [ogImage]
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  };
}

export function generateLotteryMetadata(
  code: string,
  shortName: string,
  vietnameseDate?: string,
  date?: string
): Metadata {
  const dateText = date ? ` ${date}` : ' hôm nay';
  const vietnameseDateText = vietnameseDate ? ` ${vietnameseDate}` : '';
  const title = `${shortName}${dateText} - Kết quả xổ số`;
  const description = `Tra cứu kết quả xổ số${vietnameseDateText}: giải đặc biệt, các giải đầy đủ và bảng lô tô 2 số cuối.`;

  return generateDynamicMetadata({
    title,
    description,
    canonicalPath: date ? `/${code}/${date}` : `/${code}`
  });
}

export function generateVietlottMetadata(
  product: string,
  date?: string
): Metadata {
  const productNames: Record<string, string> = {
    'mega-645': 'Mega 6/45',
    'power-655': 'Power 6/55',
    'max-3d': 'Max 3D',
    'max-3d-pro': 'Max 3D Pro'
  };

  const productName = productNames[product] || product;
  const dateText = date ? ` - ${date}` : ' hôm nay';
  const title = `${productName}${dateText} - Kết quả Vietlott`;
  const description = `Xem kết quả ${productName}${dateText} - Xổ số Vietlott với tất cả giải thưởng.`;

  return generateDynamicMetadata({
    title,
    description,
    canonicalPath: date ? `/vietlott/${product}/${date}` : `/vietlott/${product}`
  });
}

export function generateStatsMetadata(): Metadata {
  return generateDynamicMetadata({
    title: 'Thống kê xổ số',
    description: 'Thống kê kết quả xổ số - Số hay, số lạnh, phân tích chi tiết và bảng lô tô 2 số cuối.',
    canonicalPath: '/thong-ke'
  });
}

export function generateScheduleMetadata(): Metadata {
  return generateDynamicMetadata({
    title: 'Lịch mở thưởng xổ số',
    description: 'Lịch quay xổ số toàn quốc - Thời gian quay, các tỉnh/thành phố, lịch quay hàng ngày.',
    canonicalPath: '/lich-mo-thuong'
  });
}

interface BreadcrumbItem {
  name: string;
  path: string;
}

export function generateBreadcrumbListSchema(items: BreadcrumbItem[]): string {
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': absoluteUrl(item.path)
    }))
  };

  return JSON.stringify(breadcrumbList);
}
