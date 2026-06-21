import { describe, expect, it } from "vitest";
import { COCKPIT_MOUNT_PATH } from "@platform/config";
import cockpitViteConfig from "../vite.config";

describe("cockpit vite base", () => {
  it("pins the production build base to the cockpit mount path from config", () => {
    expect(cockpitViteConfig.base).toBe(COCKPIT_MOUNT_PATH);
  });

  it("keeps the config mount path at the deployed cockpit prefix", () => {
    expect(COCKPIT_MOUNT_PATH).toBe("/cockpit/");
  });
});
