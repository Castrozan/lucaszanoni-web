import type { TestQualityGoldStandardPractice } from "@platform/ingestion-contracts";
import type { QualityMetrics } from "../../data/quality-metrics";
import {
  formatKebabLabelAsSentenceTitle,
  qualityLedeClassName,
  qualitySectionHeadingClassName,
} from "./quality-report-content";

const practiceCardClassName =
  "rounded-lg border border-border bg-surface px-[1.1rem] py-[0.8rem]";
const practiceTitleClassName = "font-semibold text-primary";
const practiceMeasurementClassName = "mt-0.5 text-sm text-muted-foreground";
const practiceEvidenceClassName = "mt-1.5 text-xs text-muted-foreground";
const adoptedVerdictClassName =
  "ml-2 rounded-full border border-primary px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-primary";
const gapVerdictClassName =
  "ml-2 rounded-full border border-border px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-muted-foreground";

export interface GoldStandardSectionProps {
  readonly metrics: QualityMetrics;
}

function formatMeasurement(practice: TestQualityGoldStandardPractice): string {
  return `${practice.measurement} ${practice.measurementUnit}`;
}

export function GoldStandardSection({ metrics }: GoldStandardSectionProps) {
  const practices = metrics.goldStandardPractices;
  if (practices.length === 0) {
    return null;
  }
  const adoptedCount = practices.filter((practice) => practice.adopted).length;
  return (
    <>
      <h2 className={qualitySectionHeadingClassName}>
        Against the AI-testing gold standard
      </h2>
      <p className={qualityLedeClassName}>
        The practices below are the ones the 2026 evaluation literature treats
        as table stakes for grading a model. Each verdict is measured from the
        committed evidence in the repo on every deploy, not asserted here, so a
        practice the suite only half-implements reports as a gap:{" "}
        <strong>
          {adoptedCount} of {practices.length}
        </strong>{" "}
        adopted.
      </p>
      <div className="my-5 grid gap-2">
        {practices.map((practice) => (
          <div
            className={practiceCardClassName}
            data-practice-adopted={String(practice.adopted)}
            key={practice.practice}
          >
            <div className={practiceTitleClassName}>
              {formatKebabLabelAsSentenceTitle(practice.practice)}
              <span
                className={
                  practice.adopted
                    ? adoptedVerdictClassName
                    : gapVerdictClassName
                }
              >
                {practice.adopted ? "adopted" : "gap"}
              </span>
            </div>
            <div className={practiceMeasurementClassName}>
              {formatMeasurement(practice)}
            </div>
            <div className={practiceEvidenceClassName}>{practice.evidence}</div>
          </div>
        ))}
      </div>
    </>
  );
}
