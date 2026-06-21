import { describe, expect, it } from "vitest";
import { SHELL_MOUNT_PATH } from "@lucaszanoni-web/config";
import shellViteConfig from "../vite.config";

describe("shell vite base", () => {
  it("pins the production build base to the shell mount path from config", () => {
    expect(shellViteConfig.base).toBe(SHELL_MOUNT_PATH);
  });

  it("stays equal to the shell mount path declared in config", () => {
    expect(SHELL_MOUNT_PATH).toBe("/");
  });
});
