import type { AgentEvalsReason } from "../../data/agent-evals-report";
import {
  buildReasonBullets,
  type ReasonBullet,
} from "../../data/humanize-verdict-reasons";
import {
  qualityListClassName,
  qualitySectionHeadingClassName,
} from "../quality/quality-report-content";
import { baselineSummaryClassName } from "./baseline-report-content";

const visibleReasonCount = 3;

function ReasonList({
  bullets,
}: {
  readonly bullets: readonly ReasonBullet[];
}) {
  return (
    <ul className={qualityListClassName}>
      {bullets.map((bullet) => (
        <li key={bullet.text} title={bullet.title}>
          {bullet.text}
        </li>
      ))}
    </ul>
  );
}

export function FailureReasonsSection({
  reasons,
}: {
  readonly reasons: readonly AgentEvalsReason[];
}) {
  const bullets = buildReasonBullets(reasons);
  if (bullets.length === 0) {
    return null;
  }
  const hiddenBullets = bullets.slice(visibleReasonCount);
  return (
    <section>
      <h2 className={qualitySectionHeadingClassName}>why it is failing</h2>
      <ReasonList bullets={bullets.slice(0, visibleReasonCount)} />
      {hiddenBullets.length > 0 ? (
        <details className="mt-2">
          <summary className={`${baselineSummaryClassName} text-primary`}>
            and {hiddenBullets.length} more
          </summary>
          <ReasonList bullets={hiddenBullets} />
        </details>
      ) : null}
    </section>
  );
}
