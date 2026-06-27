import { useState } from "react";
import { MICRO_FRONTEND_ROUTES } from "@platform/config";
import type { MicroFrontendRoute } from "@platform/config";
import { featurePreviews } from "./landingContent";
import type { FeaturePreview as FeaturePreviewContent } from "./landingContent";

interface PreviewableApp {
  readonly route: MicroFrontendRoute;
  readonly preview: FeaturePreviewContent;
}

function resolvePreviewableApps(): PreviewableApp[] {
  return MICRO_FRONTEND_ROUTES.filter(
    (route) => route.accessModel.environment === "public" && route.isAiPowered,
  )
    .map((route) => {
      const preview = featurePreviews.find(
        (candidate) => candidate.routeId === route.id,
      );
      return preview ? { route, preview } : null;
    })
    .filter((entry): entry is PreviewableApp => entry !== null);
}

function FeaturePreviewCard({ route, preview }: PreviewableApp) {
  const [sampleRevealed, setSampleRevealed] = useState(false);
  return (
    <div className="flex flex-col gap-4 border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="m-0 font-grotesk text-[18px] font-bold tracking-[-0.2px] text-primary">
          {route.navigationLabel}
        </h3>
        <span className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1.5px] text-text-faint">
          AI
        </span>
      </div>
      <p className="m-0 font-mono text-[13px] leading-[1.6] tracking-[0.5px] text-muted-foreground">
        {route.description}
      </p>
      <div className="border border-border bg-surface-raised p-4 font-mono text-[12px] leading-[1.7]">
        <span className="text-text-faint">intent: </span>
        <span className="text-foreground">{preview.intentExample}</span>
        {sampleRevealed && (
          <div className="mt-3 flex flex-col gap-1 text-muted-foreground">
            {preview.sampleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <span className="mt-2 text-text-faint">
              EXAMPLE · run it live for the real thing
            </span>
          </div>
        )}
      </div>
      <p className="m-0 font-mono text-[11px] uppercase tracking-[1.5px] text-text-faint">
        {preview.sampleCaption}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {!sampleRevealed && (
          <button
            type="button"
            onClick={() => setSampleRevealed(true)}
            className="border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[1.5px] text-text-faint transition-colors hover:text-foreground"
          >
            Reveal sample
          </button>
        )}
        <a
          href={route.mountPath}
          className="border border-primary px-3 py-1.5 font-mono text-[11px] uppercase tracking-[1.5px] text-primary no-underline transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Try it live &rarr;
        </a>
      </div>
    </div>
  );
}

export function FeaturePreview() {
  const previewableApps = resolvePreviewableApps();
  if (previewableApps.length === 0) {
    return null;
  }
  return (
    <section id="preview" className="border-t border-border py-20">
      <div className="mb-10 flex items-end justify-between">
        <h2 className="m-0 font-grotesk text-[clamp(28px,6vw,64px)] font-bold tracking-[-0.5px] text-foreground">
          SEE IT WORK
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          FEATURE PREVIEW
        </span>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {previewableApps.map(({ route, preview }) => (
          <FeaturePreviewCard key={route.id} route={route} preview={preview} />
        ))}
      </div>
    </section>
  );
}
