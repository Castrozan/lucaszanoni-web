import { cn } from "@platform/design-system";
import type { AgentEvalsHeader } from "../../data/agent-evals-report";
import {
  buildVerdict,
  describeSubject,
  formatMeasuredDate,
  type VerdictTone,
} from "../../data/humanize-agent-evals-report";
import { baselineMutedTextClassName } from "./baseline-report-content";

const verdictToneClassNames: Record<VerdictTone, string> = {
  positive: "text-status-positive",
  negative: "text-status-negative",
  caution: "text-status-caution",
};

const commitPrefixLength = 8;

export function BaselineVerdict({
  header,
}: {
  readonly header: AgentEvalsHeader;
}) {
  const verdict = buildVerdict(header);
  const measurementParts = [
    `measured ${formatMeasuredDate(header.generatedAt)}`,
    header.commit ? `commit ${header.commit.slice(0, commitPrefixLength)}` : "",
    describeSubject(header),
  ].filter((part) => part !== "");
  return (
    <div className="mb-6">
      <p className="text-lg">
        <strong
          className={cn("font-semibold", verdictToneClassNames[verdict.tone])}
        >
          {verdict.label}.
        </strong>{" "}
        {verdict.detail}
      </p>
      <p className={cn("mt-1", baselineMutedTextClassName)}>
        {measurementParts.join(" · ")}
      </p>
    </div>
  );
}
