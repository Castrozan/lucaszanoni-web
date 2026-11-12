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
  it("launches ReadMeABook over Cloudflare and Tailscale", () => {
    vi.stubEnv("VITE_ARR_STACK_PUBLIC_DOMAIN", "lucaszanoni.com");
    vi.stubEnv("VITE_ARR_STACK_TAILNET_HOST", "100.94.11.81");

    expect(buildArrStackAppLinks(appById("readmeabook"))).toEqual([
      { exposure: "cloudflare", url: "https://readmeabook.lucaszanoni.com" },
      { exposure: "tailscale", url: "http://100.94.11.81:3030" },
    ]);
  });

  it("keeps ReadMeABook accessible over Cloudflare when no tailnet host is configured", () => {
    vi.stubEnv("VITE_ARR_STACK_PUBLIC_DOMAIN", "lucaszanoni.com");
    vi.stubEnv("VITE_ARR_STACK_TAILNET_HOST", "");

    expect(buildArrStackAppLinks(appById("readmeabook"))).toEqual([
      { exposure: "cloudflare", url: "https://readmeabook.lucaszanoni.com" },
    ]);
  });

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

  it("links Suwayomi through Cloudflare and directly through Tailscale", () => {
    vi.stubEnv("VITE_ARR_STACK_PUBLIC_DOMAIN", "lucaszanoni.com");
    vi.stubEnv("VITE_ARR_STACK_TAILNET_HOST", "100.94.11.81");

    expect(buildArrStackAppLinks(appById("suwayomi"))).toEqual([
      {
        exposure: "cloudflare",
        url: "https://suwayomi.lucaszanoni.com",
      },
      {
        exposure: "tailscale",
        url: "http://100.94.11.81:4567",
      },
    ]);
  });

  it("launches Stremio normally on both routes", () => {
    vi.stubEnv("VITE_ARR_STACK_PUBLIC_DOMAIN", "lucaszanoni.com");
    vi.stubEnv("VITE_ARR_STACK_TAILNET_HOST", "100.94.11.81");

    expect(buildArrStackAppLinks(appById("stremio"))).toEqual([
      {
        exposure: "cloudflare",
        url: "https://stream.lucaszanoni.com",
      },
      {
        exposure: "tailscale",
        url: "http://100.94.11.81:43212",
      },
    ]);
  });
});
