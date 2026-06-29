const nextConfig = {
  transpilePackages: ["@platform/design-system", "@platform/config"],
  basePath: "/dynamic-ia-interfaces",
  assetPrefix: "/dynamic-ia-interfaces",
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
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
