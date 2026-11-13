import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";

const DOCUMENT_HEADERS = {
  Accept: "text/html",
  "Sec-Fetch-Mode": "navigate",
};

async function verifyDocumentResponses(origin, application, html, checks) {
  const mount = application.configuration.vars.APPLICATION_MOUNT_PATH;
  for (const path of [mount, `${mount}deep-link?verification=1`]) {
    const response = await fetch(`${origin}${path}`, {
      headers: DOCUMENT_HEADERS,
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, 200, path);
    assert.equal(await response.text(), html, path);
    checks.push(`${application.applicationId}:document:${path}`);
  }
}

async function verifyAssetResponses(origin, application, html, checks) {
  const mount = application.configuration.vars.APPLICATION_MOUNT_PATH;
  const assetPaths = [
    ...html.matchAll(/(?:src|href)="([^"\s]+\.(?:js|css))"/g),
  ].map((match) => match[1]);
  assert.ok(
    assetPaths.length >= 2,
    "Production HTML must reference its built JS and CSS",
  );
  for (const path of assetPaths) {
    const response = await fetch(`${origin}${path}`, {
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, 200, path);
    const assetPath = new URL(path, origin).pathname.slice(mount.length);
    const actual = Buffer.from(await response.arrayBuffer());
    const expected = readFileSync(
      join(application.configuration.assets.directory, assetPath),
    );
    assert.equal(
      createHash("sha256").update(actual).digest("hex"),
      createHash("sha256").update(expected).digest("hex"),
      path,
    );
    checks.push(`${application.applicationId}:asset:${path}`);
  }
  return assetPaths;
}

async function verifyCanonicalRedirects(origin, staticApplications, checks) {
  for (const application of staticApplications) {
    if (application.mountPath === "/") continue;
    const redirect = await fetch(
      `${origin}${application.mountPath.slice(0, -1)}?view=docs`,
      {
        redirect: "manual",
      },
    );
    assert.equal(redirect.status, 308);
    assert.equal(
      redirect.headers.get("Location"),
      `${origin}${application.mountPath}?view=docs`,
    );
    checks.push(`${application.applicationId}:canonical-redirect`);
  }
}

async function verifyEncodedPrivateNamespace(origin, cockpitHtml, checks) {
  for (const path of ["/%63ockpit/index.html", "/assets/%2e%2e/cockpit/"]) {
    const encoded = await fetch(`${origin}${path}`, {
      headers: DOCUMENT_HEADERS,
    });
    assert.equal(await encoded.text(), cockpitHtml);
    checks.push(`normalization:private-namespace:${path}`);
  }
}

async function verifyPrivateScriptIsolation(
  origin,
  staticApplications,
  assetsByApplication,
  checks,
) {
  for (const application of staticApplications) {
    if (application.accessModel.environment === "public") continue;
    const privateScript = assetsByApplication
      .get(application.applicationId)
      .find((path) => path.endsWith(".js"));
    const privateBytes = readFileSync(
      join(
        application.configuration.assets.directory,
        "assets",
        basename(privateScript),
      ),
    );
    const publicNamespaceResponse = await fetch(
      `${origin}/assets/${basename(privateScript)}`,
    );
    assert.notDeepEqual(
      Buffer.from(await publicNamespaceResponse.arrayBuffer()),
      privateBytes,
    );
    checks.push(
      `${application.applicationId}:isolation:private-script-through-public-store`,
    );
  }
}

export async function verifyStaticApplicationResponses(
  origin,
  staticApplications,
) {
  const checks = [];
  const htmlByApplication = new Map();
  const assetsByApplication = new Map();
  for (const application of staticApplications) {
    const html = readFileSync(
      join(application.configuration.assets.directory, "index.html"),
      "utf8",
    );
    htmlByApplication.set(application.applicationId, html);
    await verifyDocumentResponses(origin, application, html, checks);
    assetsByApplication.set(
      application.applicationId,
      await verifyAssetResponses(origin, application, html, checks),
    );
  }
  await verifyCanonicalRedirects(origin, staticApplications, checks);
  await verifyEncodedPrivateNamespace(
    origin,
    htmlByApplication.get("cockpit"),
    checks,
  );
  await verifyPrivateScriptIsolation(
    origin,
    staticApplications,
    assetsByApplication,
    checks,
  );
  return checks;
}
