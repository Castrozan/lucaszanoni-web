import {
  DOTFILES_QUALITY_OVERVIEW_TOPIC,
  type IngestedSnapshotRecord,
  type QualityOverviewPayload,
} from "@platform/ingestion-contracts";
import type { SnapshotObjectWriter } from "../snapshot-object-writer";
import type { SnapshotDatabase } from "./snapshot-database";
import {
  buildLatestPointerStatement,
  buildObjectWriteStatements,
} from "./stored-object-statements";
import { buildSupersededOverviewReportTreeDeletions } from "./superseded-overview-report-trees";

const EVENT_CONTENT_TYPE = "application/json";

function buildReportRetentionStatements(
  database: SnapshotDatabase,
  record: IngestedSnapshotRecord,
): D1PreparedStatement[] {
  if (record.event.topic !== DOTFILES_QUALITY_OVERVIEW_TOPIC) {
    return [];
  }
  const { workflow } = record.event.payload as QualityOverviewPayload;
  return buildSupersededOverviewReportTreeDeletions(database, workflow);
}

export function createD1SnapshotObjectWriter(
  database: SnapshotDatabase,
): SnapshotObjectWriter {
  return {
    async writeSnapshot({ eventObjectKey, record }) {
      const producedAtEpoch = Date.parse(record.event.producedAt);
      if (Number.isNaN(producedAtEpoch)) {
        throw new Error(
          `produced at stamp ${record.event.producedAt} is not a timestamp`,
        );
      }
      await database.batch([
        ...buildObjectWriteStatements(database, {
          objectKey: eventObjectKey,
          objectKind: "event",
          contentType: EVENT_CONTENT_TYPE,
          bytes: new TextEncoder().encode(JSON.stringify(record)),
        }),
        buildLatestPointerStatement(
          database,
          record.event.topic,
          eventObjectKey,
          producedAtEpoch,
        ),
        ...buildReportRetentionStatements(database, record),
      ]);
    },
  };
}
