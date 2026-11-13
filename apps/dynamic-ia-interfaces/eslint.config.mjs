import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "cloudflare/build/**",
      "cloudflare/.wrangler/**",
    ],
  },
  ...nextCoreWebVitals,
];

export default eslintConfig;
