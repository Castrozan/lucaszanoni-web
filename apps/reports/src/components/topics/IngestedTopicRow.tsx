import { TableCell, TableRow } from "@platform/design-system";
import type { RegisteredIngestionTopic } from "../../data/ingested-topic-registry";
import { formatIngestionStamp } from "../ingested/ingestion-stamp-format";

export interface IngestedTopicRowProps {
  readonly registeredTopic: RegisteredIngestionTopic;
}

export function IngestedTopicRow({ registeredTopic }: IngestedTopicRowProps) {
  const { contract, source } = registeredTopic;
  const snapshot = source.useSnapshot();
  return (
    <TableRow>
      <TableCell>
        <code>{contract.topic}</code>
      </TableCell>
      <TableCell>v{contract.schemaVersion}</TableCell>
      <TableCell className="text-muted-foreground">
        {contract.description}
      </TableCell>
      <TableCell>
        {snapshot === null
          ? "nothing ingested yet"
          : `${formatIngestionStamp(snapshot.receivedAt)} UTC`}
      </TableCell>
    </TableRow>
  );
}
