import { describe, expect, it } from "vitest";
import { MICRO_FRONTEND_ROUTES } from "@platform/config";
import { systemDocuments } from "../src/docs/system-documents";
import { cockpitViews } from "../src/navigation/cockpit-views";
import { cockpitWorkspaceKeybindDeclarations } from "../src/navigation/cockpit-workspace-keybind-declarations";

function documentBody(documentId: string) {
  const found = systemDocuments.find(
    (systemDocument) => systemDocument.id === documentId,
  );
  if (!found) {
    throw new Error(`no system document registered for ${documentId}`);
  }
  return found.body;
}

function flowBody(documentId: string) {
  const body = documentBody(documentId);
  if (body.kind !== "flow") {
    throw new Error(`document ${documentId} is not a flow document`);
  }
  return body;
}

function keyBindingsBody(documentId: string) {
  const body = documentBody(documentId);
  if (body.kind !== "key-bindings") {
    throw new Error(`document ${documentId} is not a key-bindings document`);
  }
  return body;
}

function platformSurfacesBody(documentId: string) {
  const body = documentBody(documentId);
  if (body.kind !== "platform-surfaces") {
    throw new Error(
      `document ${documentId} is not a platform-surfaces document`,
    );
  }
  return body;
}

describe("the private system documents", () => {
  it("traces the signal path from this browser to the live agent window", () => {
    const body = flowBody("cockpit-signal-path");

    const stageIds = body.stages.map((stage) => stage.id);
    expect(stageIds[0]).toBe("browser");
    expect(stageIds.at(-1)).toBe("window");
    expect(stageIds).toContain("access");
    expect(stageIds).toContain("tunnel");
    expect(stageIds).toContain("bridge");
    expect(stageIds).toContain("multiplexer");
    expect(body.stages.every((stage) => stage.detail.length > 0)).toBe(true);
  });

  it("derives the go-to keys from the views so the guide cannot drift", () => {
    const body = keyBindingsBody("daily-operation");

    for (const view of cockpitViews) {
      expect(body.entries).toContainEqual({
        binding: `Leader ${view.leaderKey}`,
        action: `Go to ${view.label}`,
      });
    }
  });

  it("carries every workspace chord the cockpit actually registers", () => {
    const body = keyBindingsBody("daily-operation");

    for (const declaration of cockpitWorkspaceKeybindDeclarations) {
      expect(body.entries).toContainEqual({
        binding: declaration.defaultBinding,
        action: declaration.label,
      });
    }
  });

  it("maps every registered surface in registry order", () => {
    const body = platformSurfacesBody("platform-surfaces");

    expect(body.surfaces.map((surface) => surface.id)).toEqual(
      MICRO_FRONTEND_ROUTES.map((route) => route.id),
    );
  });

  it("flags the owner-only surfaces apart from the public ones", () => {
    const body = platformSurfacesBody("platform-surfaces");

    const ownerOnly = (surfaceId: string) =>
      body.surfaces.find((surface) => surface.id === surfaceId)?.isOwnerOnly;
    expect(ownerOnly("cockpit")).toBe(true);
    expect(ownerOnly("workspace")).toBe(true);
    expect(ownerOnly("shell")).toBe(false);
  });
});
