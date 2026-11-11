import { describe, expect, it } from "vitest";
import { summarizeTestSuite } from "../../src/data/humanize-test-suite";

const ranAt = "2026-11-08T02:59:45.372Z";

describe("summarizeTestSuite", () => {
  it("reports a passing suite with its count and skipped tests", () => {
    expect(
      summarizeTestSuite({
        ranAt,
        exitCode: 0,
        tests: 6969,
        failures: 0,
        errors: 0,
        skipped: 103,
      }),
    ).toEqual({
      label: "Tests passing",
      tone: "positive",
      detail: "All 6,969 ordinary tests passed, 103 skipped.",
    });
  });

  it("counts failures and errors together when the suite fails", () => {
    expect(
      summarizeTestSuite({
        ranAt,
        exitCode: 1,
        tests: 40,
        failures: 2,
        errors: 1,
      }).detail,
    ).toBe("3 of 40 ordinary tests failed.");
  });

  it("calls a failing exit without broken tests a failed suite", () => {
    expect(
      summarizeTestSuite({ ranAt, exitCode: 2, tests: 40, failures: 0 }),
    ).toMatchObject({
      tone: "negative",
      detail: "The ordinary test suite failed across 40 tests.",
    });
  });

  it("flags a suite that recorded no results", () => {
    expect(summarizeTestSuite({ ranAt, exitCode: 1 })).toMatchObject({
      label: "Tests unknown",
      tone: "caution",
    });
  });
});
