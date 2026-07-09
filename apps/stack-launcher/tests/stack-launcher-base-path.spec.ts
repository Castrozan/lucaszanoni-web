import { describe, expect, it } from "vitest";
import { findMicroFrontendRoute } from "@platform/config";
import stackLauncherViteConfig from "../vite.config";

describe("stack-launcher vite base", () => {
  it("pins the production build base to the stack-launcher mount path from the registry", () => {
    expect(stackLauncherViteConfig.base).toBe(
      findMicroFrontendRoute("stack-launcher").mountPath,
    );
  });

  it("keeps the stack-launcher mount path at the value chosen when it was scaffolded", () => {
    expect(findMicroFrontendRoute("stack-launcher").mountPath).toBe("/stack/");
  });
});
