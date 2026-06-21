import {
  shellOriginHost,
  usageOriginHost,
  reportsOriginHost,
  edgeSharedSecretHeaderName,
  edgeSharedSecretValue,
  reportsStaticBucketName,
  aliasRedirectCanonicalHost,
  aliasRedirectStatusCode,
  trustedExternalOriginHost,
  untrustedExternalOriginHost,
  multiSegmentBaseExternalOriginHost,
  multiSegmentForwardedBasePath,
  retiredApplicationMountPrefix,
  subdomainInRepoServingHost,
  subdomainInRepoOriginHost,
  subdomainUntrustedExternalServingHost,
  subdomainTrustedExternalServingHost,
} from "./edge-router-test-constants.mjs";

export const edgeEnvironment = {
  EDGE_ROUTES: JSON.stringify({
    shell: shellOriginHost,
    prefixes: [
      {
        prefix: "/engineering/dotfiles/claude/usage/",
        host: usageOriginHost,
      },
      {
        prefix: "/reports/",
        host: reportsOriginHost,
      },
    ],
  }),
  EDGE_SHARED_SECRET_HEADER_NAME: edgeSharedSecretHeaderName,
  EDGE_SHARED_SECRET: edgeSharedSecretValue,
};

export const edgeEnvironmentWithStaticBucketPrefixes = {
  EDGE_ROUTES: JSON.stringify({
    shell: shellOriginHost,
    prefixes: [
      {
        prefix: "/engineering/dotfiles/claude/usage/",
        host: usageOriginHost,
      },
      {
        prefix: "/reports/",
        host: reportsOriginHost,
      },
    ],
    staticBucketPrefixes: [
      {
        prefix: "/reports/baseline/",
        bucket: reportsStaticBucketName,
        objectKeyPrefix: "reports/baseline/",
      },
      {
        prefix: "/reports/coverage/",
        bucket: reportsStaticBucketName,
        objectKeyPrefix: "reports/coverage/",
      },
    ],
  }),
  EDGE_SHARED_SECRET_HEADER_NAME: edgeSharedSecretHeaderName,
  EDGE_SHARED_SECRET: edgeSharedSecretValue,
};

export const edgeEnvironmentWithAliasRedirect = {
  EDGE_ROUTES: JSON.stringify({
    shell: shellOriginHost,
    prefixes: [
      {
        prefix: "/engineering/dotfiles/claude/usage/",
        host: usageOriginHost,
      },
      {
        prefix: "/reports/",
        host: reportsOriginHost,
      },
    ],
    aliasRedirect: {
      canonicalHost: aliasRedirectCanonicalHost,
      statusCode: aliasRedirectStatusCode,
    },
  }),
  EDGE_SHARED_SECRET_HEADER_NAME: edgeSharedSecretHeaderName,
  EDGE_SHARED_SECRET: edgeSharedSecretValue,
};

export const edgeEnvironmentWithRetiredPrefixes = {
  EDGE_ROUTES: JSON.stringify({
    shell: shellOriginHost,
    prefixes: [
      {
        prefix: "/engineering/dotfiles/claude/usage/",
        host: usageOriginHost,
      },
      {
        prefix: "/reports/",
        host: reportsOriginHost,
      },
    ],
    retiredPrefixes: [
      {
        prefix: retiredApplicationMountPrefix,
      },
    ],
  }),
  EDGE_SHARED_SECRET_HEADER_NAME: edgeSharedSecretHeaderName,
  EDGE_SHARED_SECRET: edgeSharedSecretValue,
};

export const edgeEnvironmentWithExternalHttpsPrefixes = {
  EDGE_ROUTES: JSON.stringify({
    shell: shellOriginHost,
    prefixes: [
      {
        prefix: "/engineering/dotfiles/claude/usage/",
        host: usageOriginHost,
      },
      {
        prefix: "/reports/",
        host: reportsOriginHost,
      },
    ],
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
  }),
  EDGE_SHARED_SECRET_HEADER_NAME: edgeSharedSecretHeaderName,
  EDGE_SHARED_SECRET: edgeSharedSecretValue,
};

export const edgeEnvironmentWithSubdomains = {
  EDGE_ROUTES: JSON.stringify({
    shell: shellOriginHost,
    prefixes: [
      {
        prefix: "/engineering/dotfiles/claude/usage/",
        host: usageOriginHost,
      },
      {
        prefix: "/reports/",
        host: reportsOriginHost,
      },
    ],
    subdomains: [
      {
        host: subdomainInRepoServingHost,
        originHost: subdomainInRepoOriginHost,
        originKind: "in-repo-cloud-run",
        trusted: true,
      },
      {
        host: subdomainUntrustedExternalServingHost,
        originHost: untrustedExternalOriginHost,
        originKind: "external-https",
        trusted: false,
      },
      {
        host: subdomainTrustedExternalServingHost,
        originHost: trustedExternalOriginHost,
        originKind: "external-https",
        trusted: true,
      },
    ],
  }),
  EDGE_SHARED_SECRET_HEADER_NAME: edgeSharedSecretHeaderName,
  EDGE_SHARED_SECRET: edgeSharedSecretValue,
};
