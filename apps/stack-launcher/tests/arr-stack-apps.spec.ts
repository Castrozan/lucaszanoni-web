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

  it("publishes request and playback through the private platform domain", () => {
    expect(
      arrStackApps
        .filter((app) => app.exposure === "custom-domain")
        .map((app) => app.id),
    ).toEqual(["jellyfin", "jellyseerr"]);
    expect(arrStackApps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "jellyfin", subdomainLabel: "watch" }),
        expect.objectContaining({
          id: "jellyseerr",
          subdomainLabel: "request",
        }),
      ]),
    );
  });

  it("keeps Kavita as the only public funnel app", () => {
    expect(arrStackApps.filter((app) => app.exposure === "funnel")).toEqual([
      expect.objectContaining({ id: "kavita", funnelPort: 10000 }),
    ]);
  });

  it("does not carry a dead Homepage tile now that the stack has no port-80 dashboard", () => {
    expect(arrStackApps).not.toContainEqual(
      expect.objectContaining({ id: "homepage" }),
    );
  });
});
