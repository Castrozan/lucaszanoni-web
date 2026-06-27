import { describe, it, expect } from "vitest";
import { displayDataTableTool } from "./display-data-table-tool";

describe("displayDataTableTool", () => {
  it("generates a table with inferred columns for user topic", async () => {
    const result = await displayDataTableTool.execute(
      { topic: "users" },
      { toolCallId: "test-1", messages: [] },
    );

    expect(result.title).toContain("users");
    expect(result.columns.length).toBeGreaterThan(0);
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.totalRowCount).toBe(result.rows.length);
  });

  it("uses provided columns when specified", async () => {
    const result = await displayDataTableTool.execute(
      {
        topic: "custom data",
        columns: ["Alpha", "Beta", "Gamma"],
        rowCount: 3,
      },
      { toolCallId: "test-2", messages: [] },
    );

    expect(result.columns).toHaveLength(3);
    expect(result.columns[0].label).toBe("Alpha");
    expect(result.rows).toHaveLength(3);
  });

  it("generates the requested number of rows", async () => {
    const result = await displayDataTableTool.execute(
      { topic: "products", rowCount: 10 },
      { toolCallId: "test-3", messages: [] },
    );

    expect(result.rows).toHaveLength(10);
    expect(result.totalRowCount).toBe(10);
  });

  it("infers product columns for product topic", async () => {
    const result = await displayDataTableTool.execute(
      { topic: "product inventory" },
      { toolCallId: "test-4", messages: [] },
    );

    const columnLabels = result.columns.map((column) => column.label);
    expect(columnLabels).toContain("Name");
    expect(columnLabels).toContain("Price");
  });
});
