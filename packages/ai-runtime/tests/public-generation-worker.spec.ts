import { describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import {
  createPublicGenerationWorker,
  type PublicGenerationEnvironment,
} from "../src/public-generation-worker.ts";

const mountPath = "/generation-app/";

function workerEnvironment(applicationMountPath: string | null = mountPath) {
  const assetFetch = vi.fn(async (request: Request) =>
    Response.json({ assetPath: new URL(request.url).pathname }),
  );
  const environment = {
    APPLICATION_MOUNT_PATH: applicationMountPath ?? undefined,
    ASSETS: { fetch: assetFetch },
  } as unknown as PublicGenerationEnvironment;
  return { environment, assetFetch };
}

function createWorker() {
  const handler = vi.fn(async () => new Response("handled"));
  return {
    worker: createPublicGenerationWorker({ "api/chat": handler }),
    handler,
  };
}

const request = (path: string, init?: RequestInit) =>
  new Request(`https://site.test${path}`, init);

describe("createPublicGenerationWorker", () => {
  it("refuses to serve without a slash-delimited mount path", async () => {
    const { worker } = createWorker();
    for (const invalid of [null, "", "generation-app/", "/generation-app"]) {
      const { environment } = workerEnvironment(invalid);
      const response = await worker.fetch(
        request("/generation-app/"),
        environment,
      );
      expect(response.status).toBe(503);
    }
  });

  it("redirects the bare mount path to its trailing-slash form", async () => {
    const { worker } = createWorker();
    const response = await worker.fetch(
      request("/generation-app?view=1"),
      workerEnvironment().environment,
    );
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://site.test/generation-app/?view=1",
    );
  });

  it("rejects every path outside the mount", async () => {
    const { worker } = createWorker();
    await fc.assert(
      fc.asyncProperty(fc.webPath(), async (path) => {
        const pathname = new URL(`https://site.test${path}`).pathname;
        fc.pre(!pathname.startsWith("/generation-app"));
        const response = await worker.fetch(
          request(path),
          workerEnvironment().environment,
        );
        expect(response.status).toBe(404);
      }),
    );
  });

  it("routes only POST to a declared handler", async () => {
    const { worker, handler } = createWorker();
    const { environment } = workerEnvironment();
    const refused = await worker.fetch(
      request("/generation-app/api/chat"),
      environment,
    );
    expect(refused.status).toBe(405);
    expect(refused.headers.get("allow")).toBe("POST");
    const handled = await worker.fetch(
      request("/generation-app/api/chat", { method: "POST", body: "{}" }),
      environment,
    );
    expect(await handled.text()).toBe("handled");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("serves every other mounted path from assets without the mount prefix", async () => {
    const { worker } = createWorker();
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(
          /^[a-z0-9][a-z0-9.-]{0,10}(\/[a-z0-9][a-z0-9.-]{0,10}){0,3}$/,
        ),
        async (relativePath) => {
          fc.pre(relativePath !== "api/chat");
          const { environment, assetFetch } = workerEnvironment();
          await worker.fetch(
            request(`${mountPath}${relativePath}`),
            environment,
          );
          const assetUrl = new URL(assetFetch.mock.calls[0]![0].url);
          expect(assetUrl.pathname).toBe(
            new URL(`https://site.test/${relativePath}`).pathname,
          );
        },
      ),
    );
    const { environment, assetFetch } = workerEnvironment();
    await worker.fetch(request(mountPath), environment);
    expect(new URL(assetFetch.mock.calls[0]![0].url).pathname).toBe(
      "/index.html",
    );
  });
});
