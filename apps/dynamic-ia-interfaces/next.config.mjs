const nextConfig = {
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
