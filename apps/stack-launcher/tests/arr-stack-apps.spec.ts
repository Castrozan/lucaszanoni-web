import { describe, expect, it } from "vitest";
import { arrStackApps } from "../src/launcher/arr-stack-apps";

describe("arr stack apps", () => {
  it("publishes Stremio through its ordinary stream routes", () => {
    expect(arrStackApps).toContainEqual({
      id: "stremio",
      label: "Stremio",
      exposure: "custom-domain",
      port: 43212,
      subdomainLabel: "stream",
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
      ["stremio", "stream"],
      ["suwayomi", "suwayomi"],
      ["readmeabook", "readmeabook"],
      ["audiobookshelf", "audiobookshelf"],
    ]);
  });

  it("does not carry Miwayomi now that chise no longer runs it or its anime origin", () => {
    expect(arrStackApps).not.toContainEqual(
      expect.objectContaining({ id: "miwayomi" }),
    );
  });

  it("does not carry a dead Homepage tile now that the stack has no port-80 dashboard", () => {
    expect(arrStackApps).not.toContainEqual(
      expect.objectContaining({ id: "homepage" }),
    );
  });
});
