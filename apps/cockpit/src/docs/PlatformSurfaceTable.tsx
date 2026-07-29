import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@platform/design-system";
import type { PlatformSurface } from "./system-document";

export interface PlatformSurfaceTableProps {
  readonly label: string;
  readonly surfaces: readonly PlatformSurface[];
}

export function PlatformSurfaceTable({
  label,
  surfaces,
}: PlatformSurfaceTableProps) {
  return (
    <Table aria-label={label}>
      <TableHeader>
        <TableRow>
          <TableHead>Surface</TableHead>
          <TableHead>Path</TableHead>
          <TableHead>Reach</TableHead>
          <TableHead>Purpose</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {surfaces.map((surface) => (
          <TableRow key={surface.id}>
            <TableCell className="whitespace-nowrap font-grotesk text-[13px] font-bold">
              {surface.label}
            </TableCell>
            <TableCell className="whitespace-nowrap font-mono text-[12px] text-muted-foreground">
              {surface.mountPath}
            </TableCell>
            <TableCell>
              <Badge variant={surface.isOwnerOnly ? "default" : "secondary"}>
                {surface.isOwnerOnly ? "owner only" : "public"}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-[12px] leading-[1.6] text-muted-foreground">
              {surface.purpose}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
