import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/dynamic-ia-canvas",
  assetPrefix: "/dynamic-ia-canvas",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
