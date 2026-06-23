import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    // Hạn chế worker build để tránh race ghi manifest trên môi trường CI/container.
    cpus: 2
  }
};

export default nextConfig;
