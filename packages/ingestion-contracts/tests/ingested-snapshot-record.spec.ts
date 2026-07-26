import { describe, expect, it } from "vitest";
import {
  buildIngestedSnapshotRecord,
  parseIngestedSnapshotRecord,
  parseIngestedSnapshotRecordForTopic,
} from "../src/ingested-snapshot-record";
import { parseIngestionEvent } from "../src/ingestion-event-parser";
import { testBaselineContract } from "../src/topics/test-baseline/test-baseline-contract";
import { testCoverageContract } from "../src/topics/test-coverage/test-coverage-contract";
import { IngestionContractViolationError } from "../src/ingestion-types";
import { testBaselineEventFixture } from "./ingestion-test-fixtures";

const receivedAt = "2026-07-24T03:27:00.000Z";

function buildReferenceRecord() {
  return buildIngestedSnapshotRecord(
    parseIngestionEvent(testBaselineEventFixture),
    receivedAt,
  );
}

describe("the ingested snapshot record", () => {
  it("wraps the accepted event rather than mutating it", () => {
    const record = buildReferenceRecord();
    expect(record.receivedAt).toBe(receivedAt);
    expect(record.event.topic).toBe(testBaselineEventFixture.topic);
    expect(Object.keys(record.event)).not.toContain("receivedAt");
  });

  it("round trips through json so a reader recovers what the writer stored", () => {
    const stored = JSON.stringify(buildReferenceRecord());
    const recovered = parseIngestedSnapshotRecord(JSON.parse(stored));
    expect(recovered.receivedAt).toBe(receivedAt);
    expect(recovered.event.payload).toStrictEqual(
      testBaselineEventFixture.payload,
    );
  });

  it("refuses a stored record carrying an unknown property", () => {
    expect(() =>
      parseIngestedSnapshotRecord({
        ...buildReferenceRecord(),
        storedBy: "someone-else",
      }),
    ).toThrow(/storedBy/);
  });

  it("refuses a received at stamp without a timezone designator", () => {
    expect(() =>
      parseIngestedSnapshotRecord({
        ...buildReferenceRecord(),
        receivedAt: "2026-07-24T03:27:00",
      }),
    ).toThrow(/receivedAt/);
  });

  it("refuses a stored record whose event no longer satisfies its topic contract", () => {
    const record = buildReferenceRecord();
    expect(() =>
      parseIngestedSnapshotRecord({
        ...record,
        event: {
          ...record.event,
          payload: { ...testBaselineEventFixture.payload, passedTests: 4 },
        },
      }),
    ).toThrow(IngestionContractViolationError);
  });

  it("refuses a stored record with no event at all", () => {
    const { event: _omitted, ...withoutEvent } = buildReferenceRecord();
    expect(() => parseIngestedSnapshotRecord(withoutEvent)).toThrow(/event/);
  });
});

describe("reading a stored record against one expected topic contract", () => {
  it("accepts the record a reader of that topic asked for", () => {
    const record = parseIngestedSnapshotRecordForTopic(
      testBaselineContract,
      buildReferenceRecord(),
    );
    expect(record.receivedAt).toBe(receivedAt);
    expect(record.event.payload.passRate).toBe(
      testBaselineEventFixture.payload.passRate,
    );
  });

  it("refuses a record stored under a topic the reader did not ask for", () => {
    expect(() =>
      parseIngestedSnapshotRecordForTopic(
        testCoverageContract,
        buildReferenceRecord(),
      ),
    ).toThrow(IngestionContractViolationError);
  });

  it("refuses a record whose payload the expected contract rejects", () => {
    const record = buildReferenceRecord();
    expect(() =>
      parseIngestedSnapshotRecordForTopic(testBaselineContract, {
        ...record,
        event: {
          ...record.event,
          payload: { ...testBaselineEventFixture.payload, passedTests: 4 },
        },
      }),
    ).toThrow(IngestionContractViolationError);
  });
});
