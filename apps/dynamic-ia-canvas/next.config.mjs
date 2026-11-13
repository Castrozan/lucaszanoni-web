const nextConfig = {
  distDir: "cloudflare/build/.next",
  transpilePackages: ["@platform/design-system", "@platform/config"],
  basePath: "/dynamic-ia-canvas",
  assetPrefix: "/dynamic-ia-canvas",
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "16kb",
      allowedOrigins: ["lucaszanoni.com", "lucaszanoni.com.br"],
    },
  },
};

export default nextConfig;
