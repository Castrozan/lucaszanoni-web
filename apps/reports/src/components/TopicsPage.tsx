import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@platform/design-system";
import { REGISTERED_INGESTION_TOPICS } from "../data/ingested-topic-registry";
import { IngestedTopicRow } from "./topics/IngestedTopicRow";

export function TopicsPage() {
  return (
    <div>
      <h1 className="mt-2 mb-1 text-2xl font-semibold">ingestion topics</h1>
      <p className="mb-6 max-w-[74ch] text-muted-foreground">
        Every dashboard on this site reads one contracted topic and nothing
        else. A producer publishes an event, the ingest API validates it against
        that topic's versioned contract, and the accepted snapshot becomes the
        single source for the numbers a page renders.{" "}
        {REGISTERED_INGESTION_TOPICS.length} topics are registered.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>topic</TableHead>
            <TableHead>contract</TableHead>
            <TableHead>carries</TableHead>
            <TableHead>last ingested</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {REGISTERED_INGESTION_TOPICS.map((registeredTopic) => (
            <IngestedTopicRow
              key={registeredTopic.contract.topic}
              registeredTopic={registeredTopic}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
