import { describe, expect, it } from "vitest";
import { REPORTS_MOUNT_PATH } from "@platform/config";
import reportsViteConfig from "../vite.config";

describe("reports vite base", () => {
  it("pins the production build base to the reports mount path from config", () => {
    expect(reportsViteConfig.base).toBe(REPORTS_MOUNT_PATH);
  });

  it("keeps the config mount path at the deployed reports prefix", () => {
    expect(REPORTS_MOUNT_PATH).toBe("/engineering/dotfiles/reports/");
  });
});
