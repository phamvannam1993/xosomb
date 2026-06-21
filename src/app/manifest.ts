import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'XoSoMB.vn',
    short_name: 'XoSoMB',
    description: 'Tra cứu XSMB hôm nay, kết quả xổ số miền Bắc và sổ kết quả theo ngày.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#b91c1c',
    icons: [
      {
        src: absoluteUrl('/icon.svg'),
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  };
}
