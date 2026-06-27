import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@platform/design-system";
import { MICRO_FRONTEND_ROUTES } from "@platform/config";
import type { MicroFrontendRoute } from "@platform/config";
import { engineeringContent } from "./landingContent";

function buildProfileLabel(route: MicroFrontendRoute): string {
  return route.origin.kind === "in-repo-cloud-run"
    ? route.origin.buildProfile
    : route.origin.kind;
}

export function EngineeringSection() {
  return (
    <section id="engineering" className="border-t border-border py-20">
      <h2 className="m-0 font-grotesk text-[clamp(28px,6vw,64px)] font-bold tracking-[-0.5px] text-foreground">
        {engineeringContent.heading}
      </h2>
      <p className="mt-4 mb-10 max-w-[52rem] font-mono text-[13px] leading-[1.6] tracking-[0.5px] text-muted-foreground">
        {engineeringContent.subtitle}
      </p>
      <div className="overflow-x-auto border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>App</TableHead>
              <TableHead>Mount</TableHead>
              <TableHead>Build</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>AI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MICRO_FRONTEND_ROUTES.map((route) => (
              <TableRow key={route.id}>
                <TableCell className="font-mono text-foreground">
                  {route.id}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {route.mountPath}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {buildProfileLabel(route)}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {route.accessModel.environment}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {route.isAiPowered ? "yes" : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[1.5px] text-text-faint">
        {engineeringContent.registryTableCaption}
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {engineeringContent.narrativeCards.map((card) => (
          <div
            key={card.id}
            className="flex flex-col gap-3 border border-border bg-surface p-6"
          >
            <h3 className="m-0 font-grotesk text-[16px] font-bold tracking-[-0.2px] text-primary">
              {card.title}
            </h3>
            <p className="m-0 flex-1 font-mono text-[13px] leading-[1.6] tracking-[0.5px] text-muted-foreground">
              {card.body}
            </p>
            <a
              href={card.evidenceHref}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] uppercase tracking-[1.5px] text-text-faint no-underline transition-colors hover:text-foreground"
            >
              {card.evidenceLabel} &#8599;
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
