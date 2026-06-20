import * as React from "react";
import { cn } from "../../lib/utils";

export function Table({
  className,
  ...tableElementProps
}: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...tableElementProps}
      />
    </div>
  );
}

export function TableHeader({
  className,
  ...tableHeaderElementProps
}: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:border-border", className)}
      {...tableHeaderElementProps}
    />
  );
}

export function TableBody({
  className,
  ...tableBodyElementProps
}: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...tableBodyElementProps}
    />
  );
}

export function TableRow({
  className,
  ...tableRowElementProps
}: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("border-b border-border transition-colors", className)}
      {...tableRowElementProps}
    />
  );
}

export function TableHead({
  className,
  ...tableHeadElementProps
}: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2.5 py-2 text-left align-middle font-semibold text-muted-foreground",
        className,
      )}
      {...tableHeadElementProps}
    />
  );
}

export function TableCell({
  className,
  ...tableCellElementProps
}: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-2.5 py-2 align-middle", className)}
      {...tableCellElementProps}
    />
  );
}
