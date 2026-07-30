import type { NextConfig } from "next";

/**
 * 11-frontend-architecture.md §3: React Strict Mode always on; images
 * restricted to the Cloudflare R2 asset host (14-infrastructure-devops-architecture.md);
 * transpilePackages lists every internal workspace package so Next.js
 * compiles their TS source directly rather than requiring each package to
 * pre-build to JS.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@dbk/ui", "@dbk/api-client", "@dbk/auth", "@dbk/types", "@dbk/utils", "@dbk/config"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.dreamsbykalakaaar.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@dbk/ui"],
  },
};

export default nextConfig;
