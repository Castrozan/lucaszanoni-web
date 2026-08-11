import { describe, expect, it } from "vitest";
import { arrStackApps } from "../src/launcher/arr-stack-apps";

describe("arr stack apps", () => {
  it("links Seanime on its private tailnet port", () => {
    expect(arrStackApps).toContainEqual({
      id: "seanime",
      label: "Seanime",
      port: 43211,
    });
  });
});
