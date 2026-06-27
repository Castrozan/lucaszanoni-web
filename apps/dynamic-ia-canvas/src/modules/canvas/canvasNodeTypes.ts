import type { NodeTypes } from "@xyflow/react";
import { ComponentCanvasNodeMemoized } from "./ComponentCanvasNode";

export const canvasCustomNodeTypes: NodeTypes = {
  component: ComponentCanvasNodeMemoized,
};
