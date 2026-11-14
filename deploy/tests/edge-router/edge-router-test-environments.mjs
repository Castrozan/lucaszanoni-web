import {
  shellServiceBinding,
  usageServiceBinding,
  reportsServiceBinding,
  edgeSharedSecretHeaderName,
  edgeSharedSecretValue,
  aliasRedirectCanonicalHost,
  aliasRedirectStatusCode,
  trustedExternalOriginHost,
  untrustedExternalOriginHost,
  multiSegmentBaseExternalOriginHost,
  multiSegmentForwardedBasePath,
  retiredApplicationMountPrefix,
  subdomainUntrustedExternalServingHost,
  subdomainTrustedExternalServingHost,
} from "./edge-router-test-constants.mjs";

const workerServicePrefixes = [
  { prefix: "/", binding: shellServiceBinding },
  {
    prefix: "/engineering/dotfiles/claude/usage/",
    binding: usageServiceBinding,
  },
  { prefix: "/reports/", binding: reportsServiceBinding },
];

const createEdgeEnvironment = (additionalRoutes = {}) => ({
  EDGE_ROUTES: JSON.stringify({ workerServicePrefixes, ...additionalRoutes }),
  EDGE_SHARED_SECRET_HEADER_NAME: edgeSharedSecretHeaderName,
  EDGE_SHARED_SECRET: edgeSharedSecretValue,
});

export const edgeEnvironment = createEdgeEnvironment();

export const edgeEnvironmentWithAliasRedirect = createEdgeEnvironment({
  aliasRedirect: {
    canonicalHost: aliasRedirectCanonicalHost,
    statusCode: aliasRedirectStatusCode,
  },
});

export const edgeEnvironmentWithRetiredPrefixes = createEdgeEnvironment({
  retiredPrefixes: [{ prefix: retiredApplicationMountPrefix }],
});

export const edgeEnvironmentWithExternalHttpsPrefixes = createEdgeEnvironment({
  externalHttpsPrefixes: [
    {
      prefix: "/private/",
      originHost: trustedExternalOriginHost,
      pathRewrite: "strip-mount-path",
      forwardedBasePath: "/",
      trusted: true,
    },
    {
      prefix: "/vendor/",
      originHost: untrustedExternalOriginHost,
      pathRewrite: "preserve",
      forwardedBasePath: "",
      trusted: false,
    },
    {
      prefix: "/app/",
      originHost: multiSegmentBaseExternalOriginHost,
      pathRewrite: "strip-mount-path",
      forwardedBasePath: multiSegmentForwardedBasePath,
      trusted: true,
    },
  ],
});

export const edgeEnvironmentWithSubdomains = createEdgeEnvironment({
  subdomains: [
    {
      host: subdomainUntrustedExternalServingHost,
      originHost: untrustedExternalOriginHost,
      trusted: false,
    },
    {
      host: subdomainTrustedExternalServingHost,
      originHost: trustedExternalOriginHost,
      trusted: true,
    },
  ],
});
