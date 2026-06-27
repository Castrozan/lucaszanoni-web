import { describe, expect, it } from "vitest";
import {
  CROSS_SECTION_NAVIGATION_ROUTES,
  MICRO_FRONTEND_ROUTES,
  OWNER_SIGN_IN_ENTRY_ROUTE,
  findMicroFrontendRoute,
} from "../src/route-registry";
import type { MicroFrontendId } from "../src/route-registry";

describe("micro frontend route registry", () => {
  it("exposes every mount path with a leading and trailing slash", () => {
    for (const route of MICRO_FRONTEND_ROUTES) {
      expect(route.mountPath.startsWith("/")).toBe(true);
      expect(route.mountPath.endsWith("/")).toBe(true);
    }
  });

  it("registers a unique mount path per micro frontend", () => {
    const mountPaths = MICRO_FRONTEND_ROUTES.map((route) => route.mountPath);
    expect(new Set(mountPaths).size).toBe(mountPaths.length);
  });

  it("resolves a registered route by id and throws for an unknown id", () => {
    expect(findMicroFrontendRoute("usage-dashboard").mountPath).toBe(
      "/engineering/dotfiles/claude/usage/",
    );
    expect(() =>
      findMicroFrontendRoute("does-not-exist" as unknown as MicroFrontendId),
    ).toThrow();
  });

  it("excludes the shell root from cross-section navigation", () => {
    expect(
      CROSS_SECTION_NAVIGATION_ROUTES.map((route) => route.id),
    ).not.toContain("shell");
  });

  it("only ever surfaces publicly accessible routes in cross-section navigation", () => {
    for (const route of CROSS_SECTION_NAVIGATION_ROUTES) {
      expect(route.accessModel.environment).toBe("public");
    }
  });

  it("lands the authenticated owner in the cockpit after sign-in", () => {
    expect(OWNER_SIGN_IN_ENTRY_ROUTE.id).toBe("cockpit");
    expect(OWNER_SIGN_IN_ENTRY_ROUTE.mountPath).toBe("/cockpit/");
    expect(OWNER_SIGN_IN_ENTRY_ROUTE.accessModel.environment).toBe("private");
  });
});
