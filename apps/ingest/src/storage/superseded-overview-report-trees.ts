import type { QualityOverviewWorkflow } from "@platform/ingestion-contracts";
import type { SnapshotDatabase } from "./snapshot-database";

const SUPERSEDED_OVERVIEW_REPORT_KEYS_SQL = `WITH overview_reports AS (
  SELECT object_key, substr(object_key, length('reports/overview/') + 1) AS after_root
  FROM snapshot_objects
  WHERE object_kind = 'report' AND object_key GLOB 'reports/overview/*/*/*'
), run_segments AS (
  SELECT
    object_key,
    substr(after_root, 1, instr(after_root, '/') - 1) AS run_segment,
    substr(after_root, instr(after_root, '/') + 1) AS after_run
  FROM overview_reports
), tree_segments AS (
  SELECT
    object_key,
    run_segment,
    substr(after_run, 1, instr(after_run, '/') - 1) AS attempt_segment
  FROM run_segments
)
SELECT object_key FROM tree_segments
WHERE run_segment GLOB '[1-9]*' AND run_segment NOT GLOB '*[^0-9]*'
  AND attempt_segment GLOB '[1-9]*' AND attempt_segment NOT GLOB '*[^0-9]*'
  AND (
    CAST(run_segment AS INTEGER) < CAST(?1 AS INTEGER)
    OR (
      CAST(run_segment AS INTEGER) = CAST(?1 AS INTEGER)
      AND CAST(attempt_segment AS INTEGER) < ?2
    )
  )`;

export function buildSupersededOverviewReportTreeDeletions(
  database: SnapshotDatabase,
  workflow: Pick<QualityOverviewWorkflow, "runId" | "runAttempt">,
): D1PreparedStatement[] {
  return ["snapshot_object_chunks", "snapshot_objects"].map((table) =>
    database
      .prepare(
        `DELETE FROM ${table} WHERE object_key IN (${SUPERSEDED_OVERVIEW_REPORT_KEYS_SQL})`,
      )
      .bind(workflow.runId, workflow.runAttempt),
  );
}
