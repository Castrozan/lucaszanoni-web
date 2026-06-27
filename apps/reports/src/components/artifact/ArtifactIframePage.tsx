import { useState } from "react";

export interface ArtifactIframePageProps {
  readonly heading: string;
  readonly description: string;
  readonly artifactUrl: string;
  readonly iframeTitle: string;
}

type ArtifactLoadState = "loading" | "loaded" | "error";

export function ArtifactIframePage({
  heading,
  description,
  artifactUrl,
  iframeTitle,
}: ArtifactIframePageProps) {
  const [loadState, setLoadState] = useState<ArtifactLoadState>("loading");
  return (
    <div className="flex h-full min-h-[80vh] flex-col">
      <h1 className="mt-2 mb-1 text-2xl font-semibold">{heading}</h1>
      <p className="mb-4 max-w-[74ch] text-muted-foreground">{description}</p>
      <div className="relative flex-1 overflow-hidden rounded-lg border border-border bg-surface">
        {loadState === "loading" && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted-foreground">
            Loading the latest artifact from the public bucket.
          </div>
        )}
        {loadState === "error" && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted-foreground">
            <span>
              This artifact is not published yet. Open it directly at{" "}
              <a className="text-primary" href={artifactUrl}>
                {artifactUrl}
              </a>{" "}
              once the dotfiles deploy has run.
            </span>
          </div>
        )}
        <iframe
          title={iframeTitle}
          src={artifactUrl}
          className="h-full min-h-[70vh] w-full border-0"
          onLoad={() => setLoadState("loaded")}
          onError={() => setLoadState("error")}
        />
      </div>
    </div>
  );
}
