import type { CanvasComponentNode, CanvasComponentNodeData } from "@/core";
import type { Edge } from "@xyflow/react";
import { create } from "zustand";

type CanvasState = {
  nodes: CanvasComponentNode[];
  edges: Edge[];
  nextNodeId: number;
};

type CanvasActions = {
  addComponentNode: (
    intent: string,
    position: { x: number; y: number },
  ) => string;
  updateNodeGenerationStatus: (
    nodeId: string,
    status: CanvasComponentNodeData["generationStatus"],
  ) => void;
  updateNodeWithGeneratedComponent: (
    nodeId: string,
    title: string,
    description: string,
    jsxCode: string,
  ) => void;
  updateNodeError: (nodeId: string, errorMessage: string) => void;
  updateNodes: (nodes: CanvasComponentNode[]) => void;
  updateEdges: (edges: Edge[]) => void;
  removeNode: (nodeId: string) => void;
};

export type CanvasStore = CanvasState & CanvasActions;

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  edges: [],
  nextNodeId: 1,

  addComponentNode: (intent, position) => {
    const nodeId = `component-${get().nextNodeId}`;
    const newNode: CanvasComponentNode = {
      id: nodeId,
      type: "component",
      position,
      data: {
        userIntent: intent,
        title: "Generating...",
        description: intent,
        jsxCode: "",
        tier: "freeform",
        generationStatus: "pending",
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      nextNodeId: state.nextNodeId + 1,
    }));

    return nodeId;
  },

  updateNodeGenerationStatus: (nodeId, status) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, generationStatus: status } }
          : node,
      ),
    }));
  },

  updateNodeWithGeneratedComponent: (nodeId, title, description, jsxCode) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                title,
                description,
                jsxCode,
                generationStatus: "ready" as const,
              },
            }
          : node,
      ),
    }));
  },

  updateNodeError: (nodeId, errorMessage) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                generationStatus: "error" as const,
                errorMessage,
              },
            }
          : node,
      ),
    }));
  },

  updateNodes: (nodes) => set({ nodes }),
  updateEdges: (edges) => set({ edges }),

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
    }));
  },
}));
