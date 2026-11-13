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
  assert.match(response.headers.get("cache-control"), /no-store/);
  const html = await response.text();
  const paths = [
    ...new Set(
      [...html.matchAll(/(?:src|href)="([^"\s]+)"/g)]
        .map((match) => match[1])
        .filter((path) => path.includes("/_next/static/")),
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

async function verifyBoundedChatTransport(origin, application, checks) {
  const valid = JSON.stringify({
    messages: [
      {
        id: "local-transport",
        role: "user",
        parts: [{ type: "text", text: "Create a sample status card" }],
      },
    ],
  });
  const cases = [
    ["{", { "Content-Type": "application/json" }, 400],
    ["x".repeat(32_769), { "Content-Type": "application/json" }, 413],
    [valid, { "Content-Type": "text/plain" }, 415],
    [
      valid,
      { "Content-Type": "application/json", "Sec-Fetch-Site": "cross-site" },
      403,
    ],
    [valid, { "Content-Type": "application/json" }, 503],
    [valid, { "Content-Type": "application/json" }, 503],
    [valid, { "Content-Type": "application/json" }, 429],
  ];
  for (const [body, headers, status] of cases) {
    const response = await fetch(`${origin}${application.mountPath}api/chat`, {
      method: "POST",
      body,
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, status);
    assert.match(response.headers.get("cache-control"), /no-store/);
    await response.body?.cancel();
    checks.push(
      `${application.applicationId}:bounded-chat-transport:${status}`,
    );
  }
}

export async function verifyDynamicApplicationResponses(origin, applications) {
  const checks = [];
  for (const application of applications) {
    const paths = await verifyDynamicDocument(origin, application, checks);
    await verifyDynamicAssets(origin, application, paths, checks);
    if (application.applicationId === "dynamic-ia-interfaces")
      await verifyBoundedChatTransport(origin, application, checks);
  }
  return checks;
}
