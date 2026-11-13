import test from "node:test";
import assert from "node:assert/strict";

import edgeRouterWorker from "../../../infra/modules/cloudflare-edge/edge-router-worker.mjs";

const reportsMountPrefix = "/engineering/dotfiles/reports/";
const retiredBucketFixtureName = "retired-reports-fixture";
const routingWithRetiredBucketFields = {
  prefixes: [],
  workerServicePrefixes: [
    { prefix: reportsMountPrefix, binding: "APP_REPORTS" },
  ],
  staticBucketPrefixes: ["coverage/", "baseline/"].map((segment) => ({
    prefix: reportsMountPrefix + segment,
    bucket: retiredBucketFixtureName,
    objectKeyPrefix: "reports/" + segment,
  })),
};
const reportsRequestSuffixes = [
  "",
  "coverage/",
  "coverage",
  "coverage/index.html?refresh=1",
  "coverage/assets/report.css",
  "baseline/",
  "baseline",
  "baseline/index.html",
  "data/reports/coverage/index.html",
];

const dispatchToCanonicalReportsWorker = async (requestUrl) => {
  let forwardedUrl;
  const originalGlobalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Network fetch to a retired origin is forbidden");
  };
  try {
    const edgeResponse = await edgeRouterWorker.fetch(new Request(requestUrl), {
      EDGE_ROUTES: JSON.stringify(routingWithRetiredBucketFields),
      APP_REPORTS: {
        async fetch(receivedRequest) {
          forwardedUrl = receivedRequest.url;
          return new Response("owned-report");
        },
      },
    });
    return { responseBody: await edgeResponse.text(), forwardedUrl };
  } finally {
    globalThis.fetch = originalGlobalFetch;
  }
};

for (const suffix of reportsRequestSuffixes) {
  test(`canonical Reports Worker owns ${suffix} despite retired bucket settings`, async () => {
    const requestUrl = "https://lucaszanoni.com" + reportsMountPrefix + suffix;
    const { responseBody, forwardedUrl } =
      await dispatchToCanonicalReportsWorker(requestUrl);
    assert.equal(responseBody, "owned-report");
    assert.equal(forwardedUrl, requestUrl);
  });
}
