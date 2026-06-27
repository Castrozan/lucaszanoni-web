import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/dynamic-ia-interfaces",
  assetPrefix: "/dynamic-ia-interfaces",
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
