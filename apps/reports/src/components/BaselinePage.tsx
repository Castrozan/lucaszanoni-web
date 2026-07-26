import { baselineArtifactUrl } from "../data/report-artifact-sources";
import { useIngestedTestBaselineSnapshot } from "../data/test-baseline-snapshot";
import { ArtifactIframePage } from "./artifact/ArtifactIframePage";
import { IngestedBaselineSummary } from "./baseline/IngestedBaselineSummary";

export function BaselinePage() {
  const snapshot = useIngestedTestBaselineSnapshot();
  return (
    <ArtifactIframePage
      heading="agent-eval baseline"
      description="How well the AI agent obeys the instruction surface. The headline run is the snapshot the dotfiles pipeline ingested under its own versioned contract; the dashboard below plots the pass-rate trend across every recorded run."
      artifactUrl={baselineArtifactUrl}
      iframeTitle="agent-eval baseline dashboard"
      summary={
        snapshot ? <IngestedBaselineSummary snapshot={snapshot} /> : undefined
      }
    />
  );
}
