"use client";

import { useCanvasStore } from "@/modules/canvas/canvasStore";
import { useCallback } from "react";
import { generateComponentFromIntent } from "./generateComponentAction";

export function useComponentGenerationLifecycle() {
  const updateNodeGenerationStatus = useCanvasStore(
    (state) => state.updateNodeGenerationStatus,
  );
  const updateNodeWithGeneratedComponent = useCanvasStore(
    (state) => state.updateNodeWithGeneratedComponent,
  );
  const updateNodeError = useCanvasStore((state) => state.updateNodeError);

  const generateComponentForNode = useCallback(
    async (nodeId: string, userIntent: string) => {
      updateNodeGenerationStatus(nodeId, "generating");

      try {
        const outcome = await generateComponentFromIntent(userIntent);
        if (outcome.status === "refused") {
          updateNodeError(nodeId, outcome.reason);
          return;
        }
        const componentSpecification = outcome.specification;

        updateNodeWithGeneratedComponent(
          nodeId,
          componentSpecification.title,
          componentSpecification.description,
          componentSpecification.jsxCode,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Generation failed";
        updateNodeError(nodeId, errorMessage);
      }
    },
    [
      updateNodeGenerationStatus,
      updateNodeWithGeneratedComponent,
      updateNodeError,
    ],
  );

  return { generateComponentForNode };
}
