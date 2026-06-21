import edgeRouterWorker from "../../../infra/modules/cloudflare-edge/edge-router-worker.mjs";

export const shellOriginHost = "lucaszanoni-shell.example.run.app";
export const usageOriginHost = "lucaszanoni-usage-dashboard.example.run.app";
export const reportsOriginHost = "lucaszanoni-reports.example.run.app";
export const edgeSharedSecretHeaderName = "X-Edge-Auth";
export const edgeSharedSecretValue = "edge-router-test-secret-2f6a9c";
export const reportsStaticBucketName =
  "zg-url-shortener-2026-dotfiles-usage-snapshots";
export const aliasRedirectCanonicalHost = "lucaszanoni.com";
export const aliasRedirectStatusCode = 301;
export const trustedExternalOriginHost = "private-app.internal.example";
export const untrustedExternalOriginHost = "vendor.external.example";
export const multiSegmentBaseExternalOriginHost = "deep.internal.example";
export const multiSegmentForwardedBasePath = "/api/";
export const cloudflareAccessJwtAssertionHeaderName =
  "Cf-Access-Jwt-Assertion";

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

export const dispatchThroughEdgeFromHost = async (
  requestHost,
  requestPathAndQuery,
  incomingHeaders = {},
  environment = edgeEnvironment,
) => {
  let capturedOriginRequest;
  const originalGlobalFetch = globalThis.fetch;
  globalThis.fetch = async (originRequest) => {
    capturedOriginRequest = originRequest;
    return new Response("origin-response-body", { status: 200 });
  };
  try {
    const edgeResponse = await edgeRouterWorker.fetch(
      new Request(`https://${requestHost}${requestPathAndQuery}`, {
        headers: incomingHeaders,
      }),
      environment,
    );
    return { capturedOriginRequest, edgeResponse };
  } finally {
    globalThis.fetch = originalGlobalFetch;
  }
};

export const dispatchThroughEdge = (
  requestPathAndQuery,
  incomingHeaders = {},
  environment = edgeEnvironment,
) =>
  dispatchThroughEdgeFromHost(
    "lucaszanoni.com.br",
    requestPathAndQuery,
    incomingHeaders,
    environment,
  );

export const dispatchThroughEdgeWithStaticBuckets = (
  requestPathAndQuery,
  incomingHeaders = {},
) =>
  dispatchThroughEdge(
    requestPathAndQuery,
    incomingHeaders,
    edgeEnvironmentWithStaticBucketPrefixes,
  );

export const dispatchThroughEdgeWithExternalHttps = (
  requestPathAndQuery,
  incomingHeaders = {},
) =>
  dispatchThroughEdge(
    requestPathAndQuery,
    incomingHeaders,
    edgeEnvironmentWithExternalHttpsPrefixes,
  );
