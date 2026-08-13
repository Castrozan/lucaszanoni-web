import { afterEach, describe, expect, it, vi } from "vitest";
import { arrStackApps } from "../src/launcher/arr-stack-apps";
import { buildArrStackAppUrl } from "../src/launcher/arr-stack-host";

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

describe("buildArrStackAppUrl", () => {
  it("links funnel apps over HTTPS on their funnel ports", () => {
    vi.stubEnv("VITE_ARR_STACK_HOST", "chise.tailfdafd6.ts.net");

    expect(buildArrStackAppUrl(appById("jellyfin"))).toBe(
      "https://chise.tailfdafd6.ts.net",
    );
    expect(buildArrStackAppUrl(appById("jellyseerr"))).toBe(
      "https://chise.tailfdafd6.ts.net:8443",
    );
    expect(buildArrStackAppUrl(appById("kavita"))).toBe(
      "https://chise.tailfdafd6.ts.net:10000",
    );
  });

  it("links tailnet apps over HTTP on their private ports against the tailnet host", () => {
    vi.stubEnv("VITE_ARR_STACK_TAILNET_HOST", "100.94.11.81");

    expect(buildArrStackAppUrl(appById("bazarr"))).toBe(
      "http://100.94.11.81:6767",
    );
    expect(buildArrStackAppUrl(appById("sonarr"))).toBe(
      "http://100.94.11.81:8989",
    );
    expect(buildArrStackAppUrl(appById("homepage"))).toBe(
      "http://100.94.11.81",
    );
  });
});
