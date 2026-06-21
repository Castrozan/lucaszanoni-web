import edgeRouterWorker from "../../../infra/modules/cloudflare-edge/edge-router-worker.mjs";

import {
  edgeEnvironment,
  edgeEnvironmentWithStaticBucketPrefixes,
  edgeEnvironmentWithExternalHttpsPrefixes,
  edgeEnvironmentWithRetiredPrefixes,
  edgeEnvironmentWithSubdomains,
} from "./edge-router-test-environments.mjs";

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

export const dispatchThroughEdgeWithRetired = (
  requestPathAndQuery,
  incomingHeaders = {},
) =>
  dispatchThroughEdge(
    requestPathAndQuery,
    incomingHeaders,
    edgeEnvironmentWithRetiredPrefixes,
  );

export const dispatchThroughEdgeFromSubdomainHost = (
  requestHost,
  requestPathAndQuery,
  incomingHeaders = {},
) =>
  dispatchThroughEdgeFromHost(
    requestHost,
    requestPathAndQuery,
    incomingHeaders,
    edgeEnvironmentWithSubdomains,
  );

export const dispatchThroughEdgeApexWithSubdomains = (
  requestPathAndQuery,
  incomingHeaders = {},
) =>
  dispatchThroughEdge(
    requestPathAndQuery,
    incomingHeaders,
    edgeEnvironmentWithSubdomains,
  );
