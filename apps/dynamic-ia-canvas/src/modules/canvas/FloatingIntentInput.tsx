"use client";

import { useComponentGenerationLifecycle } from "@/modules/generation/useComponentGenerationLifecycle";
import { Send } from "lucide-react";
import { useCallback, useState } from "react";
import { useCanvasStore } from "./canvasStore";

export function FloatingIntentInput() {
  const [intentText, setIntentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addComponentNode = useCanvasStore((state) => state.addComponentNode);
  const { generateComponentForNode } = useComponentGenerationLifecycle();

  const calculateNewNodePosition = useCallback(() => {
    const nodes = useCanvasStore.getState().nodes;
    const lastNode = nodes[nodes.length - 1];
    if (lastNode) {
      return {
        x: lastNode.position.x + 450,
        y: lastNode.position.y,
      };
    }
    return { x: 100, y: 100 };
  }, []);

  const handleSubmitIntent = useCallback(async () => {
    const trimmedIntent = intentText.trim();
    if (!trimmedIntent || isSubmitting) return;

    setIsSubmitting(true);
    const position = calculateNewNodePosition();
    const nodeId = addComponentNode(trimmedIntent, position);
    setIntentText("");

    try {
      await generateComponentForNode(nodeId, trimmedIntent);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    intentText,
    isSubmitting,
    calculateNewNodePosition,
    addComponentNode,
    generateComponentForNode,
  ]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmitIntent();
      }
    },
    [handleSubmitIntent],
  );

  return (
    <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
        <input
          type="text"
          value={intentText}
          onChange={(event) => setIntentText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe a component to generate..."
          disabled={isSubmitting}
          className="w-96 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSubmitIntent}
          disabled={!intentText.trim() || isSubmitting}
          className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
