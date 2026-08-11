import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // See buyer app's next.config.ts for why this is explicit rather than inferred.
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
