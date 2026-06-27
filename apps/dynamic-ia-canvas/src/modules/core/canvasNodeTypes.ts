import type { Node } from "@xyflow/react";
import type { ComponentRenderingTier } from "./types";

export type CanvasComponentNodeData = {
  userIntent: string;
  title: string;
  description: string;
  jsxCode: string;
  tier: ComponentRenderingTier;
  generationStatus: "pending" | "generating" | "ready" | "error";
  errorMessage?: string;
};

export type CanvasComponentNode = Node<CanvasComponentNodeData, "component">;
