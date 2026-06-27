"use client";

import type { Node } from "@xyflow/react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect } from "react";
import { FloatingIntentInput } from "./FloatingIntentInput";
import { canvasCustomNodeTypes } from "./canvasNodeTypes";
import { useCanvasStore } from "./canvasStore";

export function DynamicCanvas() {
  const storeNodes = useCanvasStore((state) => state.nodes);
  const storeEdges = useCanvasStore((state) => state.edges);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
    storeNodes as Node[],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  useEffect(() => {
    setNodes(storeNodes as Node[]);
  }, [storeNodes, setNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={canvasCustomNodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls className="!border-neutral-700 !bg-neutral-800 [&>button]:!border-neutral-700 [&>button]:!bg-neutral-800 [&>button]:!text-neutral-300 [&>button:hover]:!bg-neutral-700" />
        <MiniMap
          className="!border-neutral-700 !bg-neutral-800"
          nodeColor="#3b82f6"
          maskColor="rgba(0,0,0,0.5)"
        />
      </ReactFlow>
      <FloatingIntentInput />
    </div>
  );
}
