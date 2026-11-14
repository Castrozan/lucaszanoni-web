import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createApplicationAssetManifest } from "../application-build-manifest.mjs";

const DOCUMENT_HEADERS = { Accept: "text/html", "Sec-Fetch-Mode": "navigate" };
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function verifyDynamicDocument(origin, application, checks) {
  const response = await fetch(`${origin}${application.mountPath}`, {
    headers: DOCUMENT_HEADERS,
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(response.status, 200, application.applicationId);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const html = await response.text();
  const paths = [
    ...new Set(
      [...html.matchAll(/(?:src|href)="([^"\s]+)"/g)]
        .map((match) => match[1])
        .filter((path) => path.startsWith(`${application.mountPath}assets/`)),
    ),
  ];
  assert.ok(paths.some((path) => path.endsWith(".js")));
  assert.ok(paths.some((path) => path.endsWith(".css")));
  checks.push(`${application.applicationId}:dynamic-document`);
  return paths;
}

async function verifyDynamicAssets(origin, application, paths, checks) {
  const manifest = Object.entries(
    createApplicationAssetManifest(application.configuration.assets.directory),
  );
  let firstScript;
  for (const path of paths) {
    const address = new URL(path, origin);
    assert.equal(address.origin, origin);
    assert.ok(address.pathname.startsWith(application.mountPath));
    const response = await fetch(address, {
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, 200, path);
    const bytes = Buffer.from(await response.arrayBuffer());
    const matching = manifest.filter(([relative]) =>
      address.pathname.endsWith(`/${relative}`),
    );
    assert.equal(
      matching.length,
      1,
      `Exact asset mapping required for ${path}`,
    );
    assert.equal(digest(bytes), matching[0][1], path);
    if (!firstScript && address.pathname.endsWith(".js"))
      firstScript = { address, bytes };
    checks.push(
      `${application.applicationId}:dynamic-asset:${address.pathname}`,
    );
  }
  const publicPath = firstScript.address.pathname.slice(
    application.mountPath.length - 1,
  );
  const publicResponse = await fetch(`${origin}${publicPath}`, {
    signal: AbortSignal.timeout(5000),
  });
  assert.notDeepEqual(
    Buffer.from(await publicResponse.arrayBuffer()),
    firstScript.bytes,
  );
  checks.push(`${application.applicationId}:dynamic-private-script-isolation`);
}

const BOUNDED_TRANSPORTS = {
  "dynamic-ia-interfaces": {
    path: "api/chat",
    visitorAddress: "192.0.2.10",
    maximumBodyBytes: 32_768,
    validBody: JSON.stringify({
      messages: [
        {
          id: "local-transport",
          role: "user",
          parts: [{ type: "text", text: "Create a sample status card" }],
        },
      ],
    }),
  },
  "dynamic-ia-canvas": {
    path: "api/generate-component",
    visitorAddress: "192.0.2.20",
    maximumBodyBytes: 16_384,
    validBody: JSON.stringify({ userIntent: "Create a sample status card" }),
  },
};

async function verifyBoundedTransport(origin, application, transport, checks) {
  const json = {
    "Content-Type": "application/json",
    "CF-Connecting-IP": transport.visitorAddress,
  };
  const valid = transport.validBody;
  const cases = [
    ["{", json, 400],
    ["x".repeat(transport.maximumBodyBytes + 1), json, 413],
    [valid, { ...json, "Content-Type": "text/plain" }, 415],
    [valid, { ...json, "Sec-Fetch-Site": "cross-site" }, 403],
    [valid, json, 503],
    [valid, json, 503],
    [valid, json, 429],
  ];
  const address = `${origin}${application.mountPath}${transport.path}`;
  for (const [body, headers, status] of cases) {
    const response = await fetch(address, {
      method: "POST",
      body,
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, status, `${transport.path} ${status}`);
    assert.match(response.headers.get("cache-control"), /no-store/);
    if (status === 429) assert.equal(response.headers.get("retry-after"), "60");
    await response.body?.cancel();
    checks.push(
      `${application.applicationId}:bounded-transport:${transport.path}:${status}`,
    );
  }
}

export async function verifyDynamicApplicationResponses(origin, applications) {
  const checks = [];
  for (const application of applications) {
    const paths = await verifyDynamicDocument(origin, application, checks);
    await verifyDynamicAssets(origin, application, paths, checks);
    const transport = BOUNDED_TRANSPORTS[application.applicationId];
    assert.ok(transport, `${application.applicationId} transport`);
    await verifyBoundedTransport(origin, application, transport, checks);
  }
  return checks;
}
