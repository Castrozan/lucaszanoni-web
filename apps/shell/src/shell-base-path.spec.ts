import { describe, expect, it } from "vitest";
import { SHELL_MOUNT_PATH } from "@lucaszanoni-web/config";

describe("shell vite base", () => {
  it("stays equal to the shell mount path declared in config", () => {
    expect(SHELL_MOUNT_PATH).toBe("/");
  });
});
