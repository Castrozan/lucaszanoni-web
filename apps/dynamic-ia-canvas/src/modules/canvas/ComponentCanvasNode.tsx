"use client";

import type { CanvasComponentNodeData } from "@/core";
import { SandboxedComponentRenderer } from "@/modules/sandbox/SandboxedComponentRenderer";
import { NodeResizer } from "@xyflow/react";
import { Loader2, X } from "lucide-react";
import { memo } from "react";
import { useCanvasStore } from "./canvasStore";

function ComponentCanvasNodeContent({
  id,
  data,
}: {
  id: string;
  data: CanvasComponentNodeData;
}) {
  const removeNode = useCanvasStore((state) => state.removeNode);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
      <NodeResizer
        minWidth={200}
        minHeight={150}
        lineClassName="!border-blue-500"
        handleClassName="!h-2 !w-2 !rounded-full !border-blue-500 !bg-blue-500"
      />

      <div className="flex items-center justify-between border-b border-neutral-700 px-3 py-2">
        <span className="truncate text-sm font-medium text-neutral-200">
          {data.title}
        </span>
        <button
          onClick={() => removeNode(id)}
          className="rounded p-0.5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
        >
          <X size={14} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {data.generationStatus === "pending" && (
          <PendingGenerationPlaceholder intent={data.userIntent} />
        )}
        {data.generationStatus === "generating" && (
          <GeneratingComponentIndicator />
        )}
        {data.generationStatus === "ready" && (
          <SandboxedComponentRenderer jsxCode={data.jsxCode} />
        )}
        {data.generationStatus === "error" && (
          <GenerationErrorDisplay errorMessage={data.errorMessage ?? ""} />
        )}
      </div>
    </div>
  );
}

function PendingGenerationPlaceholder({ intent }: { intent: string }) {
  return (
    <div className="flex h-full items-center justify-center p-4 text-center text-sm text-neutral-500">
      {intent}
    </div>
  );
}

function GeneratingComponentIndicator() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      <span className="text-sm text-neutral-400">Generating component...</span>
    </div>
  );
}

function GenerationErrorDisplay({ errorMessage }: { errorMessage: string }) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="rounded-md border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">
        {errorMessage || "Component generation failed"}
      </div>
    </div>
  );
}

export const ComponentCanvasNodeMemoized = memo(ComponentCanvasNodeContent);
