import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
