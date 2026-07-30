import type { NextConfig } from 'next';

/**
 * Next.js configuration for the Dreams by Kalakaaar v2 backend.
 *
 * This app is the single backend surface described in 10-backend-architecture.md
 * Section 3.1: Route Handlers under `src/app/api/v1/**` implement the REST
 * contract from 09-api-architecture.md; there is no separate API server.
 *
 * Security headers below implement 12-security-architecture.md Section 8.2
 * (HSTS) and Section 11 (browser security headers). Route Handlers set their
 * own `Content-Type`/CORS behaviour per-route since API responses need
 * different caching semantics than static assets.
 */
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['pino', 'pino-pretty'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
