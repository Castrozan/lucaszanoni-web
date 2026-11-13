import type { SnapshotObjectWriter } from "../snapshot-object-writer";
import type { SnapshotDatabase } from "./snapshot-database";
import {
  buildLatestPointerStatement,
  buildObjectWriteStatements,
} from "./stored-object-statements";

const EVENT_CONTENT_TYPE = "application/json";

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
      ]);
    },
  };
}
