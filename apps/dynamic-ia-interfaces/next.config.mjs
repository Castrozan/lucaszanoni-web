const nextConfig = {
  distDir: "cloudflare/build/.next",
  transpilePackages: ["@platform/design-system", "@platform/config"],
  basePath: "/dynamic-ia-interfaces",
  assetPrefix: "/dynamic-ia-interfaces",
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
