import { afterEach, describe, expect, it, vi } from "vitest";
import {
  activateStatusBarWindow,
  activateStatusBarWindowAtIndex,
} from "../../src/status-bar/statusBarNavigation";
import type {
  StatusBarActionWindowModel,
  StatusBarLinkWindowModel,
} from "../../src/status-bar/statusBarModel";

function buildActionWindow(
  overrides: Partial<StatusBarActionWindowModel> = {},
): StatusBarActionWindowModel {
  return {
    kind: "action",
    id: "dynamic-ia-canvas-about",
    label: "About",
    isActive: false,
    onSelect: vi.fn(),
    ...overrides,
  };
}

function buildLinkWindow(
  overrides: Partial<StatusBarLinkWindowModel> = {},
): StatusBarLinkWindowModel {
  return {
    kind: "link",
    id: "cockpit",
    label: "Cockpit",
    href: "/cockpit/",
    isActive: false,
    ...overrides,
  };
}

const originalWindowLocation = window.location;

function stubWindowLocationAssign(): ReturnType<typeof vi.fn> {
  const assign = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { assign },
  });
  return assign;
}

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalWindowLocation,
  });
});

describe("activateStatusBarWindow", () => {
  it("runs onSelect for an action window that is already active", () => {
    const alreadyActiveActionWindow = buildActionWindow({ isActive: true });
    activateStatusBarWindow(alreadyActiveActionWindow);
    expect(alreadyActiveActionWindow.onSelect).toHaveBeenCalledOnce();
  });

  it("does not navigate for a link window that is already active", () => {
    const assignSpy = stubWindowLocationAssign();
    activateStatusBarWindow(buildLinkWindow({ isActive: true }));
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it("runs onSelect for an inactive action window", () => {
    const inactiveActionWindow = buildActionWindow({ isActive: false });
    activateStatusBarWindow(inactiveActionWindow);
    expect(inactiveActionWindow.onSelect).toHaveBeenCalledOnce();
  });

  it("navigates to the href for an inactive link window", () => {
    const assignSpy = stubWindowLocationAssign();
    activateStatusBarWindow(
      buildLinkWindow({ isActive: false, href: "/cockpit/dashboard" }),
    );
    expect(assignSpy).toHaveBeenCalledWith("/cockpit/dashboard");
  });
});

describe("activateStatusBarWindowAtIndex", () => {
  it("activates the window found at the given index", () => {
    const inactiveActionWindow = buildActionWindow({ isActive: false });
    activateStatusBarWindowAtIndex([inactiveActionWindow], 0);
    expect(inactiveActionWindow.onSelect).toHaveBeenCalledOnce();
  });

  it("silently does nothing for an index past the end of the windows list", () => {
    const inactiveActionWindow = buildActionWindow({ isActive: false });
    expect(() =>
      activateStatusBarWindowAtIndex([inactiveActionWindow], 5),
    ).not.toThrow();
    expect(inactiveActionWindow.onSelect).not.toHaveBeenCalled();
  });
});
