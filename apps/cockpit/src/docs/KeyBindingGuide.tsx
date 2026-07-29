import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@platform/design-system";
import type { KeyBindingEntry } from "./system-document";

export interface KeyBindingGuideProps {
  readonly label: string;
  readonly entries: readonly KeyBindingEntry[];
}

export function KeyBindingGuide({ label, entries }: KeyBindingGuideProps) {
  return (
    <Table aria-label={label}>
      <TableHeader>
        <TableRow>
          <TableHead>Chord</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={`${entry.binding} ${entry.action}`}>
            <TableCell className="whitespace-nowrap font-mono text-[12px]">
              {entry.binding}
            </TableCell>
            <TableCell className="font-mono text-[12px] text-muted-foreground">
              {entry.action}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
