import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/dynamic-ia-canvas",
  assetPrefix: "/dynamic-ia-canvas",
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
