import { expect, it } from "vitest";
import { allTopicEventFixtures } from "../all-topic-event-fixtures";
import { openLocalWorkerRuntime } from "./local-worker-runtime";
import { producerHeaders } from "./worker-test-requests";

it("uses the deployment's canonical mount binding instead of a hardcoded ingest prefix", async () => {
  const runtime = await openLocalWorkerRuntime("/private-producer/");
  try {
    const event = allTopicEventFixtures[0]!;
    const accepted = await runtime.ingest.fetch(
      `http://ingest.local/private-producer/${event.topic}`,
      {
        method: "POST",
        headers: { ...producerHeaders, "content-type": "application/json" },
        body: JSON.stringify(event),
      },
    );
    expect(accepted.status).toBe(202);
    const oldMount = await runtime.ingest.fetch(
      "http://ingest.local/ingest/livez",
    );
    expect(oldMount.status).toBe(404);
  } finally {
    await runtime.dispose();
  }
});
