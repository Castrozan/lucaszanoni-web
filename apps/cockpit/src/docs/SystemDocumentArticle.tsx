import { Card, CardContent } from "@platform/design-system";
import { KeyBindingGuide } from "./KeyBindingGuide";
import { PlatformSurfaceTable } from "./PlatformSurfaceTable";
import { SystemFlowDiagram } from "./SystemFlowDiagram";
import type { SystemDocument, SystemDocumentBody } from "./system-document";

function SystemDocumentBodyView({
  body,
}: {
  readonly body: SystemDocumentBody;
}) {
  if (body.kind === "flow") {
    return <SystemFlowDiagram label={body.label} stages={body.stages} />;
  }
  if (body.kind === "key-bindings") {
    return <KeyBindingGuide label={body.label} entries={body.entries} />;
  }
  return <PlatformSurfaceTable label={body.label} surfaces={body.surfaces} />;
}

export interface SystemDocumentArticleProps {
  readonly systemDocument: SystemDocument;
}

export function SystemDocumentArticle({
  systemDocument,
}: SystemDocumentArticleProps) {
  return (
    <article aria-label={systemDocument.title} className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <h2 className="m-0 font-grotesk text-[clamp(18px,2.4vw,26px)] font-bold leading-none tracking-[-0.5px]">
          {systemDocument.title}
        </h2>
        <p className="m-0 max-w-[70ch] font-mono text-[13px] leading-[1.7] text-muted-foreground">
          {systemDocument.summary}
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <SystemDocumentBodyView body={systemDocument.body} />
        </CardContent>
      </Card>
    </article>
  );
}
