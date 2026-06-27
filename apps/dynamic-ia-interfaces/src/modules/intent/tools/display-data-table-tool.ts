import { tool } from "ai";
import { z } from "zod";

export const displayDataTableToolOutputSchema = z.object({
  title: z.string(),
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      alignment: z.enum(["left", "center", "right"]),
    }),
  ),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
  totalRowCount: z.number(),
});

export type DisplayDataTableToolOutput = z.infer<
  typeof displayDataTableToolOutputSchema
>;

export const displayDataTableTool = tool({
  description:
    "Display data in an interactive table format. Use when the user asks to see data, lists, records, comparisons, or any structured information that fits a tabular layout.",
  inputSchema: z.object({
    topic: z.string().describe("What data to display in the table"),
    columns: z
      .array(z.string())
      .describe("Column names for the table")
      .optional(),
    rowCount: z
      .number()
      .describe("Number of rows to generate")
      .default(5)
      .optional(),
  }),
  execute: async function ({ topic, columns, rowCount = 5 }) {
    const resolvedColumns = columns ?? inferColumnsFromTopic(topic);

    const tableColumns = resolvedColumns.map((columnName) => ({
      key: columnName.toLowerCase().replace(/\s+/g, "_"),
      label: columnName,
      alignment: "left" as const,
    }));

    const rows = generateSampleRowsForTopic(
      topic,
      tableColumns,
      rowCount,
    );

    return {
      title: `${topic}`,
      columns: tableColumns,
      rows,
      totalRowCount: rows.length,
    };
  },
});

function inferColumnsFromTopic(topic: string): string[] {
  const topicLower = topic.toLowerCase();
  if (topicLower.includes("user") || topicLower.includes("people")) {
    return ["Name", "Email", "Role", "Status"];
  }
  if (topicLower.includes("product") || topicLower.includes("item")) {
    return ["Name", "Price", "Category", "Stock"];
  }
  if (topicLower.includes("order") || topicLower.includes("transaction")) {
    return ["Order ID", "Customer", "Amount", "Date"];
  }
  if (topicLower.includes("country") || topicLower.includes("city")) {
    return ["Name", "Population", "Region", "Area (km²)"];
  }
  return ["Name", "Value", "Category", "Description"];
}

function generateSampleRowsForTopic(
  topic: string,
  columns: DisplayDataTableToolOutput["columns"],
  rowCount: number,
): DisplayDataTableToolOutput["rows"] {
  return Array.from({ length: rowCount }, (_, index) =>
    Object.fromEntries(
      columns.map((column) => [
        column.key,
        generateCellValueForColumn(column.key, index, topic),
      ]),
    ),
  );
}

function generateCellValueForColumn(
  columnKey: string,
  rowIndex: number,
  topic: string,
): string | number {
  if (columnKey.includes("price") || columnKey.includes("amount")) {
    return Math.round((10 + rowIndex * 15.5 + Math.sin(rowIndex) * 20) * 100) / 100;
  }
  if (columnKey.includes("stock") || columnKey.includes("population") || columnKey.includes("area")) {
    return Math.round(100 + rowIndex * 250 + Math.cos(rowIndex) * 50);
  }
  if (columnKey.includes("date")) {
    const date = new Date(2026, 2, 1 + rowIndex);
    return date.toISOString().split("T")[0];
  }
  if (columnKey.includes("status")) {
    return ["Active", "Pending", "Completed", "Active", "Inactive"][rowIndex % 5];
  }
  if (columnKey.includes("id")) {
    return `${topic.substring(0, 3).toUpperCase()}-${1000 + rowIndex}`;
  }
  return `${capitalizeFirstLetter(columnKey.replace(/_/g, " "))} ${rowIndex + 1}`;
}

function capitalizeFirstLetter(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
