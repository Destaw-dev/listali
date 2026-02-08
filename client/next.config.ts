import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Redirect root to default locale so https://app.listali.co.il/ always works
  async redirects() {
    return [
      { source: '/', destination: '/he', permanent: false },
    ];
  },
  // Reduces "missing a sourcemap" noise in dev when using Turbopack (optional)
  productionBrowserSourceMaps: false,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.204:5000' || 'http://localhost:5000',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://192.168.1.204:5000' || 'http://localhost:5000',
  },
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'http' as const,
        hostname: 'localhost',
      },
      {
        protocol: 'https' as const,
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https' as const,
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Compression
  compress: true,
  // Ignore ESLint errors during build (only for production code, tests are already fixed)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default withNextIntl(nextConfig);
