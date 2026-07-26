import { describe, expect, it } from "vitest";
import { parseTestCoveragePayload } from "../../src/topics/test-coverage/test-coverage-parser";
import { IngestionContractViolationError } from "../../src/ingestion-types";
import { testCoveragePayloadFixture } from "../ingestion-test-fixtures";

describe("parseTestCoveragePayload", () => {
  const validPayload = testCoveragePayloadFixture;

  it("accepts a well formed coverage payload", () => {
    const payload = parseTestCoveragePayload(validPayload);
    expect(payload.coveredLines).toBe(61);
    expect(payload.measurableLines).toBe(169);
    expect(payload.files).toHaveLength(3);
  });

  it("accepts a file that is covered in full", () => {
    const payload = parseTestCoveragePayload(validPayload);
    expect(payload.files[0]?.lineCoverageRate).toBe(1);
  });

  it("rejects an unknown payload property", () => {
    expect(() =>
      parseTestCoveragePayload({ ...validPayload, branchCoverageRate: 0.5 }),
    ).toThrow(/branchCoverageRate/);
  });

  it("rejects an unknown property on a measured file", () => {
    expect(() =>
      parseTestCoveragePayload({
        ...validPayload,
        files: [
          { ...validPayload.files[0], hits: 3 },
          ...validPayload.files.slice(1),
        ],
      }),
    ).toThrow(/hits/);
  });

  it("rejects a run that covers more lines than it measured", () => {
    expect(() =>
      parseTestCoveragePayload({ ...validPayload, coveredLines: 400 }),
    ).toThrow(/coveredLines/);
  });

  it("rejects a coverage rate that contradicts the line counts", () => {
    expect(() =>
      parseTestCoveragePayload({ ...validPayload, lineCoverageRate: 0.9 }),
    ).toThrow(/lineCoverageRate/);
  });

  it("rejects files whose line counts do not account for the run totals", () => {
    expect(() =>
      parseTestCoveragePayload({
        ...validPayload,
        files: validPayload.files.slice(1),
      }),
    ).toThrow(/account for/);
  });

  it("rejects a file whose own rate contradicts its counts", () => {
    expect(() =>
      parseTestCoveragePayload({
        ...validPayload,
        files: [
          { ...validPayload.files[0], lineCoverageRate: 0.2 },
          ...validPayload.files.slice(1),
        ],
      }),
    ).toThrow(/lineCoverageRate/);
  });

  it("rejects the same measured file twice", () => {
    expect(() =>
      parseTestCoveragePayload({
        ...validPayload,
        coveredLines: 89,
        measurableLines: 197,
        lineCoverageRate: 0.4518,
        files: [...validPayload.files, validPayload.files[0]],
      }),
    ).toThrow(/more than once/);
  });

  it("rejects a measured path that escapes the repository", () => {
    expect(() =>
      parseTestCoveragePayload({
        ...validPayload,
        files: [
          { ...validPayload.files[0], path: "/etc/shadow" },
          ...validPayload.files.slice(1),
        ],
      }),
    ).toThrow(/path/);
  });

  it("rejects a run that measured nothing", () => {
    expect(() =>
      parseTestCoveragePayload({
        ...validPayload,
        coveredLines: 0,
        measurableLines: 0,
        lineCoverageRate: 0,
        files: [],
      }),
    ).toThrow(/measurableLines/);
  });

  it("rejects a recorded stamp without a timezone designator", () => {
    expect(() =>
      parseTestCoveragePayload({
        ...validPayload,
        recordedAt: "2026-07-24 21:08:44",
      }),
    ).toThrow(/recordedAt/);
  });

  it("throws the contract violation type so the api answers with four hundred", () => {
    expect(() => parseTestCoveragePayload({})).toThrow(
      IngestionContractViolationError,
    );
  });
});
