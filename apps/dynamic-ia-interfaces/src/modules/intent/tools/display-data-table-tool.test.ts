import { describe, it, expect } from "vitest";
import { generateDataTableForRequest } from "./display-data-table-tool";

describe("generateDataTableForRequest", () => {
  it("generates a table with inferred columns for user topic", () => {
    const result = generateDataTableForRequest({ topic: "users" });

    expect(result.title).toContain("users");
    expect(result.columns.length).toBeGreaterThan(0);
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.totalRowCount).toBe(result.rows.length);
  });

  it("uses provided columns when specified", () => {
    const result = generateDataTableForRequest({
      topic: "custom data",
      columns: ["Alpha", "Beta", "Gamma"],
      rowCount: 3,
    });

    expect(result.columns).toHaveLength(3);
    expect(result.columns[0].label).toBe("Alpha");
    expect(result.rows).toHaveLength(3);
  });

  it("generates the requested number of rows", () => {
    const result = generateDataTableForRequest({
      topic: "products",
      rowCount: 10,
    });

    expect(result.rows).toHaveLength(10);
    expect(result.totalRowCount).toBe(10);
  });

  it("infers product columns for product topic", () => {
    const result = generateDataTableForRequest({ topic: "product inventory" });

    const columnLabels = result.columns.map((column) => column.label);
    expect(columnLabels).toContain("Name");
    expect(columnLabels).toContain("Price");
  });
});
