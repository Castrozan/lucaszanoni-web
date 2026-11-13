import { decideVisitorAdmission } from "./visitor-inference-quota-policy";

type AdmissionTimeStorage = Readonly<{
  get(key: string): Promise<unknown>;
  put(key: string, value: readonly number[]): Promise<void>;
}>;

const admissionTimesStorageKey = "admission-times";

export class VisitorInferenceQuota {
  readonly #storage: AdmissionTimeStorage;

  constructor(state: Readonly<{ storage: AdmissionTimeStorage }>) {
    this.#storage = state.storage;
  }

  async fetch(): Promise<Response> {
    const storedAdmissionTimes = await this.#storage.get(
      admissionTimesStorageKey,
    );
    const previousAdmissionTimes = Array.isArray(storedAdmissionTimes)
      ? storedAdmissionTimes.filter(Number.isFinite)
      : [];
    const decision = decideVisitorAdmission(previousAdmissionTimes, Date.now());
    if (
      decision.admitted ||
      decision.retainedAdmissionTimes.length !== previousAdmissionTimes.length
    )
      await this.#storage.put(
        admissionTimesStorageKey,
        decision.retainedAdmissionTimes,
      );
    return Response.json({ admitted: decision.admitted });
  }
}
