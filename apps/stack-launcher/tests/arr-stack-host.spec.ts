import { afterEach, describe, expect, it, vi } from "vitest";
import { arrStackApps } from "../src/launcher/arr-stack-apps";
import { buildArrStackAppLinks } from "../src/launcher/arr-stack-host";

const appById = (id: string) => {
  const app = arrStackApps.find((candidate) => candidate.id === id);
  if (!app) {
    throw new Error(`no arr-stack app with id ${id}`);
  }
  return app;
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildArrStackAppLinks", () => {
  it("links public media apps through Cloudflare and directly through Tailscale", () => {
    vi.stubEnv("VITE_ARR_STACK_PUBLIC_DOMAIN", "lucaszanoni.com");
    vi.stubEnv("VITE_ARR_STACK_TAILNET_HOST", "100.94.11.81");

    expect(buildArrStackAppLinks(appById("jellyfin"))).toEqual([
      {
        exposure: "cloudflare",
        url: "https://watch.lucaszanoni.com",
      },
      {
        exposure: "tailscale",
        url: "http://100.94.11.81:8096",
      },
    ]);
  });

  it("links tailnet-only apps over HTTP on their private ports", () => {
    vi.stubEnv("VITE_ARR_STACK_TAILNET_HOST", "100.94.11.81");

    expect(buildArrStackAppLinks(appById("bazarr"))).toEqual([
      {
        exposure: "tailscale",
        url: "http://100.94.11.81:6767",
      },
    ]);
  });

  it("launches Stremio setup on both routes", () => {
    vi.stubEnv("VITE_ARR_STACK_PUBLIC_DOMAIN", "lucaszanoni.com");
    vi.stubEnv("VITE_ARR_STACK_TAILNET_HOST", "100.94.11.81");

    expect(buildArrStackAppLinks(appById("stremio"))).toEqual([
      {
        exposure: "cloudflare",
        url: "https://stream.lucaszanoni.com/setup",
      },
      {
        exposure: "tailscale",
        url: "http://100.94.11.81:43212/setup",
      },
    ]);
  });
});
