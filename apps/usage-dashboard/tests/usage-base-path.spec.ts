import { describe, expect, it } from "vitest";
import { USAGE_DASHBOARD_MOUNT_PATH } from "@lucaszanoni-web/config";
import usageDashboardViteConfig from "../vite.config";

describe("usage dashboard vite base", () => {
  it("pins the production build base to the usage-dashboard mount path from config", () => {
    expect(usageDashboardViteConfig.base).toBe(USAGE_DASHBOARD_MOUNT_PATH);
  });

  it("keeps the config mount path at the deployed usage prefix", () => {
    expect(USAGE_DASHBOARD_MOUNT_PATH).toBe(
      "/engineering/dotfiles/claude/usage/",
    );
  });
});
