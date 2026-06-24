import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    // Hạn chế worker build để tránh race ghi manifest trên môi trường CI/container.
    cpus: 2
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }
        ]
      }
    ];
  }
};

export default nextConfig;
