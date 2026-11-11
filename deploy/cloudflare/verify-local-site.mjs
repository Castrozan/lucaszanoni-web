import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { appRegistry } from "../../packages/config/src/app-registry.ts";
import {
  createApplicationBuildEnvironment,
  createSiteDeploymentPlan,
} from "./application-deployment.mjs";

async function reservePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolveClosed) => server.close(resolveClosed));
  return port;
}

export async function verifyLocalSite() {
  const repositoryDirectory = resolve(
    fileURLToPath(new URL("../..", import.meta.url)),
  );
  const registry = appRegistry
    .filter(
      (application) =>
        ["shell", "cockpit"].includes(application.id) ||
        application.origin.kind === "cloudflare-worker",
    )
    .map((application) => ({
      ...application,
      origin: {
        kind: "cloudflare-worker",
        scriptName: `lucaszanoni-${application.id}`,
      },
    }));
  const settings = {
    compatibility_date: "2024-11-01",
    bindings: [
      {
        name: "EDGE_ROUTES",
        type: "plain_text",
        text: JSON.stringify({ shell: null, prefixes: [] }),
      },
    ],
  };
  const plan = createSiteDeploymentPlan(
    settings,
    registry,
    repositoryDirectory,
  );
  const environment = { ...process.env, WRANGLER_SEND_METRICS: "false" };
  for (const application of plan.applications) {
    const result = spawnSync(
      "pnpm",
      ["--filter", application.source.appPackageName, "build"],
      {
        cwd: repositoryDirectory,
        env: createApplicationBuildEnvironment(application.source, environment),
        stdio: "inherit",
      },
    );
    if (result.status !== 0)
      throw new Error(
        `Local application build failed: ${application.applicationId}`,
      );
  }
  const directory = mkdtempSync(join(tmpdir(), "site-local-verification-"));
  let worker;
  let workerClosed;
  let logs = "";
  const checks = [];
  try {
    const configurations = [
      plan.edgeConfiguration,
      ...plan.applications.map((application) => application.configuration),
    ];
    const configurationArguments = configurations.flatMap(
      (configuration, index) => {
        const path = join(directory, `${index}.json`);
        writeFileSync(path, JSON.stringify(configuration), { mode: 0o600 });
        return ["--config", path];
      },
    );
    const port = await reservePort();
    worker = spawn(
      "pnpm",
      [
        "exec",
        "wrangler",
        "dev",
        "--local",
        "--ip",
        "127.0.0.1",
        "--port",
        String(port),
        "--persist-to",
        join(directory, "state"),
        ...configurationArguments,
      ],
      {
        cwd: repositoryDirectory,
        env: environment,
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    workerClosed = new Promise((resolveClosed) =>
      worker.once("close", resolveClosed),
    );
    for (const stream of [worker.stdout, worker.stderr])
      stream.on("data", (chunk) => {
        logs = (logs + chunk.toString()).slice(-32_000);
      });
    let spawnError;
    worker.on("error", (error) => {
      spawnError = error;
    });
    const origin = `http://127.0.0.1:${port}`;
    const documentHeaders = {
      Accept: "text/html",
      "Sec-Fetch-Mode": "navigate",
    };
    const deadline = Date.now() + 60_000;
    let ready = false;
    while (Date.now() < deadline && !ready) {
      if (spawnError) throw spawnError;
      if (worker.exitCode !== null)
        throw new Error("Local Worker exited before readiness");
      try {
        ready =
          (
            await fetch(`${origin}/`, {
              headers: documentHeaders,
              signal: AbortSignal.timeout(1000),
            })
          ).status === 200;
      } catch {}
      if (!ready) await delay(200);
    }
    assert.equal(ready, true, "Local multi-Worker runtime must become healthy");
    const htmlByApplication = new Map();
    const assetsByApplication = new Map();
    for (const application of plan.applications) {
      const html = readFileSync(
        join(application.configuration.assets.directory, "index.html"),
        "utf8",
      );
      htmlByApplication.set(application.applicationId, html);
      const mount = application.configuration.vars.APPLICATION_MOUNT_PATH;
      for (const path of [mount, `${mount}deep-link?verification=1`]) {
        const response = await fetch(`${origin}${path}`, {
          headers: documentHeaders,
          redirect: "manual",
          signal: AbortSignal.timeout(5000),
        });
        assert.equal(response.status, 200, path);
        assert.equal(await response.text(), html, path);
        checks.push(`${application.applicationId}:document:${path}`);
      }
      const assetPaths = [
        ...html.matchAll(/(?:src|href)="([^"\s]+\.(?:js|css))"/g),
      ].map((match) => match[1]);
      assert.ok(
        assetPaths.length >= 2,
        "Production HTML must reference its built JS and CSS",
      );
      assetsByApplication.set(application.applicationId, assetPaths);
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
    }
    for (const application of plan.applications) {
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
    for (const path of ["/%63ockpit/index.html", "/assets/%2e%2e/cockpit/"]) {
      const encoded = await fetch(`${origin}${path}`, {
        headers: documentHeaders,
      });
      assert.equal(await encoded.text(), htmlByApplication.get("cockpit"));
      checks.push(`normalization:private-namespace:${path}`);
    }
    for (const application of plan.applications) {
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
    console.log(
      JSON.stringify(
        {
          status: "passed",
          applications: plan.applications.map(
            (application) => application.applicationId,
          ),
          checks: checks.length,
          verified: checks,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    if (logs) console.error(logs);
    throw error;
  } finally {
    if (worker?.pid) {
      const processGroupId = worker.pid;
      const signalWorkerGroup = (signal) => {
        try {
          process.kill(-processGroupId, signal);
        } catch (error) {
          if (error.code !== "ESRCH") throw error;
        }
      };
      signalWorkerGroup("SIGTERM");
      const killTimer = setTimeout(() => signalWorkerGroup("SIGKILL"), 5000);
      try {
        await workerClosed;
      } finally {
        clearTimeout(killTimer);
      }
    }
    rmSync(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await verifyLocalSite();
