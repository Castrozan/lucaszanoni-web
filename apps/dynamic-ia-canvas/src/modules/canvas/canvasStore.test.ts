import { describe, expect, it, beforeEach } from "vitest";
import { useCanvasStore } from "./canvasStore";

describe("canvasStore", () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [],
      edges: [],
      nextNodeId: 1,
    });
  });

  it("adds a component node with pending status", () => {
    const nodeId = useCanvasStore
      .getState()
      .addComponentNode("Show a counter", { x: 100, y: 200 });

    expect(nodeId).toBe("component-1");

    const nodes = useCanvasStore.getState().nodes;
    expect(nodes).toHaveLength(1);
    expect(nodes[0].data.userIntent).toBe("Show a counter");
    expect(nodes[0].data.generationStatus).toBe("pending");
    expect(nodes[0].position).toEqual({ x: 100, y: 200 });
  });

  it("increments node IDs", () => {
    useCanvasStore.getState().addComponentNode("First", { x: 0, y: 0 });
    useCanvasStore.getState().addComponentNode("Second", { x: 0, y: 0 });

    const nodes = useCanvasStore.getState().nodes;
    expect(nodes[0].id).toBe("component-1");
    expect(nodes[1].id).toBe("component-2");
  });

  it("updates node generation status", () => {
    useCanvasStore.getState().addComponentNode("Test", { x: 0, y: 0 });

    useCanvasStore
      .getState()
      .updateNodeGenerationStatus("component-1", "generating");

    const node = useCanvasStore.getState().nodes[0];
    expect(node.data.generationStatus).toBe("generating");
  });

  it("updates node with generated component", () => {
    useCanvasStore.getState().addComponentNode("Test", { x: 0, y: 0 });

    useCanvasStore
      .getState()
      .updateNodeWithGeneratedComponent(
        "component-1",
        "Counter",
        "A simple counter",
        "function App() { return <div>0</div>; }",
      );

    const node = useCanvasStore.getState().nodes[0];
    expect(node.data.title).toBe("Counter");
    expect(node.data.description).toBe("A simple counter");
    expect(node.data.jsxCode).toContain("function App()");
    expect(node.data.generationStatus).toBe("ready");
  });

  it("updates node with error", () => {
    useCanvasStore.getState().addComponentNode("Test", { x: 0, y: 0 });

    useCanvasStore.getState().updateNodeError("component-1", "API timeout");

    const node = useCanvasStore.getState().nodes[0];
    expect(node.data.generationStatus).toBe("error");
    expect(node.data.errorMessage).toBe("API timeout");
  });

  it("removes a node", () => {
    useCanvasStore.getState().addComponentNode("First", { x: 0, y: 0 });
    useCanvasStore.getState().addComponentNode("Second", { x: 0, y: 0 });

    useCanvasStore.getState().removeNode("component-1");

    const nodes = useCanvasStore.getState().nodes;
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe("component-2");
  });
});
