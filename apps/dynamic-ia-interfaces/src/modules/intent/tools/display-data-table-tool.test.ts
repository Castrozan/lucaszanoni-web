import { describe, it, expect } from "vitest";
import {
  buildDataTableFromModelInput,
  generateDataTableForRequest,
} from "./display-data-table-tool";

describe("buildDataTableFromModelInput", () => {
  it("renders the model-provided rows verbatim instead of placeholders", () => {
    const result = buildDataTableFromModelInput({
      title: "Top programming languages",
      columns: ["Language", "First appeared", "Paradigm"],
      rows: [
        ["Python", 1991, "Multi-paradigm"],
        ["JavaScript", 1995, "Multi-paradigm"],
        ["Rust", 2010, "Systems"],
      ],
    });

    expect(result.title).toBe("Top programming languages");
    expect(result.columns.map((column) => column.label)).toEqual([
      "Language",
      "First appeared",
      "Paradigm",
    ]);
    expect(result.totalRowCount).toBe(3);
    const firstRow = result.rows[0];
    const firstColumnKey = result.columns[0].key;
    expect(firstRow[firstColumnKey]).toBe("Python");
  });

  it("falls back to the synthetic generator when the model supplies no rows", () => {
    const result = buildDataTableFromModelInput({
      title: "anything",
      columns: ["Name", "Value"],
      rows: [],
    });

    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("pads short rows so every column has a cell", () => {
    const result = buildDataTableFromModelInput({
      title: "Sparse",
      columns: ["A", "B", "C"],
      rows: [["only-a"]],
    });

    const row = result.rows[0];
    const lastColumnKey = result.columns[2].key;
    expect(row[lastColumnKey]).toBe("—");
  });
});

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
