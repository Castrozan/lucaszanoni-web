import type { DisplayDataTableToolOutput } from "@/intent/tools/display-data-table-tool";

export function DataTableDisplay({
  title,
  columns,
  rows,
  totalRowCount,
}: DisplayDataTableToolOutput) {
  return (
    <div className="border-border w-full max-w-2xl overflow-hidden rounded-lg border">
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-foreground text-sm font-medium">{title}</h3>
        <span className="text-muted-foreground text-xs">
          {totalRowCount} rows
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-border bg-muted/30 border-b">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-muted-foreground px-4 py-2 text-xs font-medium ${alignmentToTextAlign(
                    column.alignment,
                  )}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-border/50 hover:bg-muted/20 border-b transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`text-foreground px-4 py-2 text-sm ${alignmentToTextAlign(
                      column.alignment,
                    )}`}
                  >
                    {formatCellValue(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function alignmentToTextAlign(alignment: "left" | "center" | "right"): string {
  const alignmentClassMap = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };
  return alignmentClassMap[alignment];
}

function formatCellValue(value: string | number | undefined): string {
  if (value === undefined) return "—";
  if (typeof value === "number") {
    return value % 1 !== 0 ? value.toFixed(2) : value.toLocaleString();
  }
  return String(value);
}
