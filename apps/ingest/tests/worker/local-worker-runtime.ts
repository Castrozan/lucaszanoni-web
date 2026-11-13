import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { applyMigration } from "../storage/local-d1-store";
import type { SnapshotDatabase } from "../../src/storage/snapshot-database";

export const LOCAL_PRODUCER_SECRET = "local-fixture-producer-secret";

const ENTRYPOINT_PATH = new URL(
  "../../src/worker/entrypoint.ts",
  import.meta.url,
).pathname;

const CONSUMER_SCRIPT = `
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/read") {
      const stored = await env.READER.readSnapshotObject(url.searchParams.get("key"));
      if (stored === null) return new Response(null, { status: 404 });
      return new Response(stored.body, { headers: { "content-type": stored.contentType } });
    }
    const attempted = [];
    for (const method of ["prepare", "exec", "batch", "writeSnapshot", "fetch"]) {
      try { await env.READER[method]("SELECT 1"); attempted.push(method + ":allowed"); }
      catch { attempted.push(method + ":refused"); }
    }
    return Response.json(attempted);
  },
};
`;

export interface LocalWorkerRuntime {
  readonly miniflare: Miniflare;
  readonly ingest: {
    fetch: (input: string, init?: RequestInit) => Promise<Response>;
  };
  readonly unconfigured: {
    fetch: (input: string, init?: RequestInit) => Promise<Response>;
  };
  readonly consumer: {
    fetch: (input: string, init?: RequestInit) => Promise<Response>;
  };
  readonly dispose: () => Promise<void>;
}

async function bundleWorker(): Promise<string> {
  const result = await build({
    entryPoints: [ENTRYPOINT_PATH],
    bundle: true,
    platform: "neutral",
    format: "esm",
    target: "es2022",
    conditions: ["workerd", "worker", "browser"],
    mainFields: ["module", "main"],
    external: ["cloudflare:*", "node:*"],
    write: false,
  });
  const [output] = result.outputFiles;
  if (output === undefined) {
    throw new Error("the worker bundle produced no output");
  }
  return output.text;
}

export async function openLocalWorkerRuntime(
  mountPath = "/ingest/",
): Promise<LocalWorkerRuntime> {
  const contents = await bundleWorker();
  const common = {
    modules: [{ type: "ESModule" as const, path: "worker.mjs", contents }],
    compatibilityDate: "2024-11-01",
    compatibilityFlags: ["nodejs_compat"],
  };
  const miniflare = new Miniflare(
    convertV4MiniflareOptions({
      workers: [
        {
          ...common,
          name: "ingest",
          d1Databases: { SNAPSHOT_DATABASE: "local-fixture-ingest-database" },
          bindings: {
            INGEST_PRODUCER_SECRET: LOCAL_PRODUCER_SECRET,
            APPLICATION_MOUNT_PATH: mountPath,
          },
        },
        {
          ...common,
          name: "unconfigured",
          bindings: { APPLICATION_MOUNT_PATH: mountPath },
          d1Databases: {
            SNAPSHOT_DATABASE: "local-fixture-unconfigured-database",
          },
        },
        {
          name: "consumer",
          compatibilityDate: "2024-11-01",
          modules: true,
          script: CONSUMER_SCRIPT,
          serviceBindings: {
            READER: { name: "ingest", entrypoint: "SnapshotReader" },
          },
        },
      ],
    }),
  );
  try {
    for (const workerName of ["ingest", "unconfigured"]) {
      await applyMigration(
        (await miniflare.getD1Database(
          "SNAPSHOT_DATABASE",
          workerName,
        )) as unknown as SnapshotDatabase,
      );
    }
    return {
      miniflare,
      ingest: await miniflare.getWorker("ingest"),
      unconfigured: await miniflare.getWorker("unconfigured"),
      consumer: await miniflare.getWorker("consumer"),
      dispose: () => miniflare.dispose(),
    } as unknown as LocalWorkerRuntime;
  } catch (failure) {
    await miniflare.dispose();
    throw failure;
  }
}
