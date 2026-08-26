import { describe, expect, it } from "vitest";
import { arrStackApps } from "../src/launcher/arr-stack-apps";

describe("arr stack apps", () => {
  it("links Seanime on its private tailnet port", () => {
    expect(arrStackApps).toContainEqual({
      id: "seanime",
      label: "Seanime",
      exposure: "tailnet",
      port: 43211,
    });
  });

  it("publishes Stremio through the stream domain and direct tailnet setup path", () => {
    expect(arrStackApps).toContainEqual({
      id: "stremio",
      label: "Stremio",
      exposure: "custom-domain",
      port: 43212,
      subdomainLabel: "stream",
      launchPath: "/setup",
    });
  });

  it("publishes request, playback, and reading through the private platform domain", () => {
    expect(
      arrStackApps
        .filter((app) => app.exposure === "custom-domain")
        .map((app) => app.id),
    ).toEqual(["jellyfin", "jellyseerr", "kavita", "stremio"]);
    expect(arrStackApps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "jellyfin", subdomainLabel: "watch" }),
        expect.objectContaining({
          id: "jellyseerr",
          subdomainLabel: "request",
        }),
        expect.objectContaining({ id: "kavita", subdomainLabel: "read" }),
      ]),
    );
  });

  it("does not carry a dead Homepage tile now that the stack has no port-80 dashboard", () => {
    expect(arrStackApps).not.toContainEqual(
      expect.objectContaining({ id: "homepage" }),
    );
  });
});
