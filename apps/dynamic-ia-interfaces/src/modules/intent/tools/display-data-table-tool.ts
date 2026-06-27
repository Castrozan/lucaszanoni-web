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

export interface ModelProvidedDataTableInput {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}

export function buildDataTableFromModelInput({
  title,
  columns,
  rows,
}: ModelProvidedDataTableInput): DisplayDataTableToolOutput {
  if (columns.length === 0 || rows.length === 0) {
    return generateDataTableForRequest({
      topic: title,
      columns: columns.length > 0 ? columns : undefined,
    });
  }

  const tableColumns = columns.map((label, columnIndex) => ({
    key: `column_${columnIndex}`,
    label,
    alignment: "left" as const,
  }));

  const tableRows = rows.map((cells) =>
    Object.fromEntries(
      tableColumns.map((column, columnIndex) => [
        column.key,
        cells[columnIndex] ?? "—",
      ]),
    ),
  );

  return {
    title,
    columns: tableColumns,
    rows: tableRows,
    totalRowCount: tableRows.length,
  };
}

export interface GenerateDataTableRequest {
  topic: string;
  columns?: string[];
  rowCount?: number;
}

export function generateDataTableForRequest({
  topic,
  columns,
  rowCount = 5,
}: GenerateDataTableRequest): DisplayDataTableToolOutput {
  const resolvedColumns = columns ?? inferColumnsFromTopic(topic);

  const tableColumns = resolvedColumns.map((columnName) => ({
    key: columnName.toLowerCase().replace(/\s+/g, "_"),
    label: columnName,
    alignment: "left" as const,
  }));

  const rows = generateSampleRowsForTopic(topic, tableColumns, rowCount);

  return {
    title: `${topic}`,
    columns: tableColumns,
    rows,
    totalRowCount: rows.length,
  };
}

export const displayDataTableTool = tool({
  description:
    "Display real, factual data in an interactive table. You MUST fill columns and rows with accurate content that actually answers the request (real programming languages, real countries, real figures), never placeholders like 'Name 1' or 'Value 1'. Use when the user asks to see data, lists, records, comparisons, or any structured information that fits a tabular layout.",
  inputSchema: z.object({
    title: z.string().describe("Title describing what the table shows"),
    columns: z
      .array(z.string())
      .min(1)
      .describe("Column header labels, in display order"),
    rows: z
      .array(z.array(z.union([z.string(), z.number()])))
      .describe(
        "Each row's cell values in the same order as columns, populated with real data",
      ),
  }),
  execute: async (request) => buildDataTableFromModelInput(request),
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
    return (
      Math.round((10 + rowIndex * 15.5 + Math.sin(rowIndex) * 20) * 100) / 100
    );
  }
  if (
    columnKey.includes("stock") ||
    columnKey.includes("population") ||
    columnKey.includes("area")
  ) {
    return Math.round(100 + rowIndex * 250 + Math.cos(rowIndex) * 50);
  }
  if (columnKey.includes("date")) {
    const date = new Date(2026, 2, 1 + rowIndex);
    return date.toISOString().split("T")[0];
  }
  if (columnKey.includes("status")) {
    return ["Active", "Pending", "Completed", "Active", "Inactive"][
      rowIndex % 5
    ];
  }
  if (columnKey.includes("id")) {
    return `${topic.substring(0, 3).toUpperCase()}-${1000 + rowIndex}`;
  }
  return `${capitalizeFirstLetter(columnKey.replace(/_/g, " "))} ${rowIndex + 1}`;
}

function capitalizeFirstLetter(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
