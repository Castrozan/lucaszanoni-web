const nextConfig = {
  basePath: "/dynamic-ia-canvas",
  assetPrefix: "/dynamic-ia-canvas",
  skipTrailingSlashRedirect: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
      allowedOrigins: ["lucaszanoni.com", "lucaszanoni.com.br"],
    },
  },
};

export default nextConfig;
