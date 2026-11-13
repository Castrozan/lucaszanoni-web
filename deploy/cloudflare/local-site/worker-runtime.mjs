import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";

const READINESS_DEADLINE_MILLISECONDS = 60_000;
const PROCESS_KILL_GRACE_MILLISECONDS = 5_000;
const LOG_TAIL_CHARACTERS = 32_000;

async function reservePort(requestedPort = 0) {
  const server = createServer();
  server.listen(requestedPort, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolveClosed) => server.close(resolveClosed));
  return port;
}

function writePrivateConfigurationFiles(directory, configurations) {
  return configurations.map((configuration, index) => {
    const path = join(directory, `${index}.json`);
    writeFileSync(path, JSON.stringify(configuration), { mode: 0o600 });
    return path;
  });
}

function applyLocalMigrations(
  { repositoryDirectory, environment, persistDirectory },
  configurations,
  configurationPaths,
) {
  configurations.forEach((configuration, index) => {
    for (const database of configuration.d1_databases ?? []) {
      const result = spawnSync(
        "pnpm",
        [
          "exec",
          "wrangler",
          "d1",
          "migrations",
          "apply",
          database.binding,
          "--local",
          "--config",
          configurationPaths[index],
          "--persist-to",
          persistDirectory,
        ],
        { cwd: repositoryDirectory, env: environment, encoding: "utf8" },
      );
      if (result.status !== 0)
        throw new Error(
          `Local D1 migrations failed for ${database.binding}: ${result.stderr}${result.stdout}`,
        );
    }
  });
}

function spawnMultiWorkerRuntime(
  { repositoryDirectory, environment, persistDirectory },
  port,
  configurationPaths,
) {
  return spawn(
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
      persistDirectory,
      ...configurationPaths.flatMap((path) => ["--config", path]),
    ],
    {
      cwd: repositoryDirectory,
      env: environment,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

async function waitForReadiness(origin, worker, readSpawnError) {
  const deadline = Date.now() + READINESS_DEADLINE_MILLISECONDS;
  let ready = false;
  while (Date.now() < deadline && !ready) {
    if (readSpawnError()) throw readSpawnError();
    if (worker.exitCode !== null)
      throw new Error("Local Worker exited before readiness");
    try {
      ready =
        (
          await fetch(`${origin}/`, {
            headers: { Accept: "text/html", "Sec-Fetch-Mode": "navigate" },
            signal: AbortSignal.timeout(1000),
          })
        ).status === 200;
    } catch {}
    if (!ready) await delay(200);
  }
  assert.equal(ready, true, "Local multi-Worker runtime must become healthy");
}

function signalProcessGroup(processGroupId, signal) {
  try {
    process.kill(-processGroupId, signal);
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

async function disposeWorker(worker, workerClosed) {
  if (!worker?.pid) return;
  signalProcessGroup(worker.pid, "SIGTERM");
  const killTimer = setTimeout(
    () => signalProcessGroup(worker.pid, "SIGKILL"),
    PROCESS_KILL_GRACE_MILLISECONDS,
  );
  try {
    await workerClosed;
  } finally {
    clearTimeout(killTimer);
  }
}

export async function withLocalWorkerRuntime(options, useRuntime) {
  const { configurations, environment, repositoryDirectory } = options;
  const directory = mkdtempSync(join(tmpdir(), "site-local-verification-"));
  const runtimeOptions = {
    repositoryDirectory,
    environment,
    persistDirectory: join(directory, "state"),
  };
  let worker;
  let workerClosed;
  let port;
  let spawnError;
  let logs = "";
  try {
    const configurationPaths = writePrivateConfigurationFiles(
      directory,
      configurations,
    );
    applyLocalMigrations(runtimeOptions, configurations, configurationPaths);
    port = await reservePort();
    worker = spawnMultiWorkerRuntime(runtimeOptions, port, configurationPaths);
    workerClosed = new Promise((resolveClosed) =>
      worker.once("close", resolveClosed),
    );
    worker.on("error", (error) => {
      spawnError = error;
    });
    for (const stream of [worker.stdout, worker.stderr])
      stream.on("data", (chunk) => {
        logs = (logs + chunk.toString()).slice(-LOG_TAIL_CHARACTERS);
      });
    const origin = `http://127.0.0.1:${port}`;
    await waitForReadiness(origin, worker, () => spawnError);
    return await useRuntime({ origin });
  } catch (error) {
    if (logs) console.error(logs);
    throw error;
  } finally {
    try {
      await disposeWorker(worker, workerClosed);
      if (port !== undefined) await reservePort(port);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
}
