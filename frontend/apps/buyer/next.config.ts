import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 11-frontend-architecture.md §3: React Strict Mode always on; images
 * restricted to the Cloudflare R2 asset host (14-infrastructure-devops-architecture.md);
 * transpilePackages lists every internal workspace package so Next.js
 * compiles their TS source directly rather than requiring each package to
 * pre-build to JS.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pins the workspace root explicitly to `frontend/` (where the real
  // package-lock.json / npm workspaces live), two levels up from this app.
  // Next.js infers this by walking up looking for a lockfile, which used to
  // find a stray, unrelated package-lock.json at the repo root above
  // `frontend/` (removed in cleanup) alongside the real one — ambiguous
  // enough to warn. Being explicit removes the guesswork entirely rather
  // than depending on no stray lockfile ever reappearing above this one.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@dbk/ui", "@dbk/api-client", "@dbk/auth", "@dbk/types", "@dbk/utils", "@dbk/config"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.dreamsbykalakaaar.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@dbk/ui"],
  },
};

export default nextConfig;
