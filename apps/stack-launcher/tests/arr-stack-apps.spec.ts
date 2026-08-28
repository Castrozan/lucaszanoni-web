import { describe, expect, it } from "vitest";
import { arrStackApps } from "../src/launcher/arr-stack-apps";

describe("arr stack apps", () => {
  it("publishes Miwayomi through its private domain and tailnet port", () => {
    expect(arrStackApps).toContainEqual({
      id: "miwayomi",
      label: "Miwayomi",
      exposure: "custom-domain",
      port: 4568,
      subdomainLabel: "anime",
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

  it("publishes every app through the private platform domain", () => {
    expect(
      arrStackApps
        .filter((app) => app.exposure === "custom-domain")
        .map((app) => [app.id, app.subdomainLabel]),
    ).toEqual([
      ["jellyfin", "watch"],
      ["jellyseerr", "request"],
      ["kavita", "read"],
      ["stremio", "stream"],
      ["miwayomi", "anime"],
      ["radarr", "radarr"],
      ["sonarr", "sonarr"],
      ["prowlarr", "prowlarr"],
      ["bazarr", "bazarr"],
      ["suwayomi", "suwayomi"],
      ["qbittorrent", "qbittorrent"],
    ]);
  });

  it("does not carry a dead Homepage tile now that the stack has no port-80 dashboard", () => {
    expect(arrStackApps).not.toContainEqual(
      expect.objectContaining({ id: "homepage" }),
    );
  });
});
