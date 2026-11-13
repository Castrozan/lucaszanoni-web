import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { allTopicEventFixtures } from "../all-topic-event-fixtures";
import {
  openLocalWorkerRuntime,
  type LocalWorkerRuntime,
} from "./local-worker-runtime";
import { producerHeaders, readThroughReader } from "./worker-test-requests";

let runtime: LocalWorkerRuntime;

beforeAll(async () => {
  runtime = await openLocalWorkerRuntime();
}, 60_000);
afterAll(async () => {
  await runtime?.dispose();
});

describe("ingesting every registered topic through the Worker", () => {
  it.each(allTopicEventFixtures.map((fixture) => [fixture.topic, fixture]))(
    "accepts %s and serves the stored record through the named reader",
    async (topic, fixture) => {
      const response = await runtime.ingest.fetch(
        `http://ingest.local/ingest/${topic}`,
        {
          method: "POST",
          headers: { ...producerHeaders, "content-type": "application/json" },
          body: JSON.stringify(fixture),
        },
      );
      expect(response.status).toBe(202);
      const receipt = (await response.json()) as Record<string, unknown>;
      expect(Object.keys(receipt).sort()).toStrictEqual([
        "eventObjectKey",
        "latestObjectKey",
        "schemaVersion",
        "topic",
      ]);
      const latest = await readThroughReader(
        runtime,
        String(receipt["latestObjectKey"]),
      );
      const event = await readThroughReader(
        runtime,
        String(receipt["eventObjectKey"]),
      );
      expect(latest.status).toBe(200);
      const record = (await latest.json()) as { event: unknown };
      expect(record.event).toStrictEqual(JSON.parse(JSON.stringify(fixture)));
      expect(await event.text()).toBe(JSON.stringify(record));
    },
  );
});
