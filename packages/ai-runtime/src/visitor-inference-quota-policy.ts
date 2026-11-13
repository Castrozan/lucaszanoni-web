export type VisitorInferenceQuotaPolicy = Readonly<{
  admissionsPerMinute: number;
  admissionsPerDay: number;
}>;

export type VisitorAdmissionDecision = Readonly<{
  admitted: boolean;
  retainedAdmissionTimes: readonly number[];
}>;

export const visitorInferenceQuotaPolicy: VisitorInferenceQuotaPolicy = {
  admissionsPerMinute: 2,
  admissionsPerDay: 10,
};

const minuteMilliseconds = 60_000;
const dayMilliseconds = 86_400_000;

export function decideVisitorAdmission(
  previousAdmissionTimes: readonly number[],
  nowMilliseconds: number,
  policy: VisitorInferenceQuotaPolicy = visitorInferenceQuotaPolicy,
): VisitorAdmissionDecision {
  const retainedAdmissionTimes = previousAdmissionTimes.filter(
    (admissionTime) => admissionTime > nowMilliseconds - dayMilliseconds,
  );
  const admissionsInLastMinute = retainedAdmissionTimes.filter(
    (admissionTime) => admissionTime > nowMilliseconds - minuteMilliseconds,
  ).length;
  const admitted =
    admissionsInLastMinute < policy.admissionsPerMinute &&
    retainedAdmissionTimes.length < policy.admissionsPerDay;
  return {
    admitted,
    retainedAdmissionTimes: admitted
      ? [...retainedAdmissionTimes, nowMilliseconds]
      : retainedAdmissionTimes,
  };
}
