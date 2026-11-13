import { afterEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import {
  decideVisitorAdmission,
  visitorInferenceQuotaPolicy,
} from "../src/visitor-inference-quota-policy.ts";
import { VisitorInferenceQuota } from "../src/visitor-inference-quota.ts";

const minuteMilliseconds = 60_000;
const dayMilliseconds = 86_400_000;
const { admissionsPerMinute, admissionsPerDay } = visitorInferenceQuotaPolicy;

const requestTimes = fc
  .array(fc.integer({ min: 0, max: 3 * dayMilliseconds }), { maxLength: 200 })
  .map((times) => [...times].sort((first, second) => first - second));

function simulateAdmissions(times: readonly number[]) {
  let storedAdmissionTimes: readonly number[] = [];
  const admittedTimes: number[] = [];
  const decisions = times.map((time) => {
    const previousAdmissionTimes = storedAdmissionTimes;
    const decision = decideVisitorAdmission(previousAdmissionTimes, time);
    storedAdmissionTimes = decision.retainedAdmissionTimes;
    if (decision.admitted) admittedTimes.push(time);
    return { time, previousAdmissionTimes, decision };
  });
  return { admittedTimes, decisions };
}

function admissionsWithin(
  admittedTimes: readonly number[],
  windowEnd: number,
  windowLength: number,
) {
  return admittedTimes.filter(
    (time) => time > windowEnd - windowLength && time <= windowEnd,
  ).length;
}

describe("visitor inference quota policy", () => {
  it("never admits more than the per-minute or per-day allowance in any window", () => {
    fc.assert(
      fc.property(requestTimes, (times) => {
        const { admittedTimes } = simulateAdmissions(times);
        for (const time of admittedTimes) {
          expect(
            admissionsWithin(admittedTimes, time, minuteMilliseconds),
          ).toBeLessThanOrEqual(admissionsPerMinute);
          expect(
            admissionsWithin(admittedTimes, time, dayMilliseconds),
          ).toBeLessThanOrEqual(admissionsPerDay);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("refuses only when a window allowance is already spent", () => {
    fc.assert(
      fc.property(requestTimes, (times) => {
        const { admittedTimes, decisions } = simulateAdmissions(times);
        for (const { time, decision } of decisions) {
          if (decision.admitted) continue;
          const earlier = admittedTimes.filter((admitted) => admitted <= time);
          expect(
            admissionsWithin(earlier, time, minuteMilliseconds) >=
              admissionsPerMinute ||
              admissionsWithin(earlier, time, dayMilliseconds) >=
                admissionsPerDay,
          ).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("retains only the last day of admissions and never more than the daily allowance", () => {
    fc.assert(
      fc.property(requestTimes, (times) => {
        for (const { time, decision } of simulateAdmissions(times).decisions) {
          expect(decision.retainedAdmissionTimes.length).toBeLessThanOrEqual(
            admissionsPerDay,
          );
          for (const retained of decision.retainedAdmissionTimes)
            expect(retained).toBeGreaterThan(time - dayMilliseconds);
        }
      }),
      { numRuns: 200 },
    );
  });
});

function memoryStorage(initial?: unknown) {
  const values = new Map<string, unknown>();
  if (initial !== undefined) values.set("admission-times", initial);
  return {
    values,
    get: vi.fn(async (key: string) => values.get(key)),
    put: vi.fn(async (key: string, value: readonly number[]) => {
      values.set(key, value);
    }),
  };
}

async function admit(quota: VisitorInferenceQuota) {
  const response = await quota.fetch();
  return ((await response.json()) as { admitted: boolean }).admitted;
}

describe("visitor inference quota durable object", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("admits the per-minute allowance, refuses the next request, and recovers after a minute", async () => {
    vi.useFakeTimers({ now: dayMilliseconds });
    const storage = memoryStorage();
    const quota = new VisitorInferenceQuota({ storage });
    expect(await admit(quota)).toBe(true);
    expect(await admit(quota)).toBe(true);
    expect(await admit(quota)).toBe(false);
    expect(storage.put).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(minuteMilliseconds);
    expect(await admit(quota)).toBe(true);
  });

  it("persists an admission that replaces an expired one", async () => {
    vi.useFakeTimers({ now: 2 * dayMilliseconds });
    const now = Date.now();
    const fullDay = [
      now - dayMilliseconds,
      ...Array.from(
        { length: admissionsPerDay - 1 },
        (_, index) =>
          now - dayMilliseconds + (index + 1) * 2 * minuteMilliseconds,
      ),
    ];
    const storage = memoryStorage(fullDay);
    const quota = new VisitorInferenceQuota({ storage });
    expect(await admit(quota)).toBe(true);
    expect(storage.values.get("admission-times")).toContain(now);
    expect(await admit(quota)).toBe(false);
  });

  it("treats corrupt stored state as no prior admissions", async () => {
    for (const corrupt of ["x", { 0: 1 }, null, [Number.NaN, "1"]]) {
      const quota = new VisitorInferenceQuota({
        storage: memoryStorage(corrupt),
      });
      expect(await admit(quota)).toBe(true);
    }
  });
});
