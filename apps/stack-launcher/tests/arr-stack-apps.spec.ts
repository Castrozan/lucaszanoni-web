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

  it("publishes only the login-bearing front ends on the funnel", () => {
    expect(
      arrStackApps
        .filter((app) => app.exposure === "funnel")
        .map((app) => app.id),
    ).toEqual(["jellyfin", "jellyseerr", "kavita"]);
  });

  it("gives each funnel app a distinct Tailscale Funnel HTTPS port", () => {
    expect(arrStackApps.filter((app) => app.exposure === "funnel")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "jellyfin", funnelPort: 443 }),
        expect.objectContaining({ id: "jellyseerr", funnelPort: 8443 }),
        expect.objectContaining({ id: "kavita", funnelPort: 10000 }),
      ]),
    );
  });
});
