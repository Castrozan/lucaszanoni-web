export class IngestionContractViolationError extends Error {}

export interface IngestionEventSource {
  readonly repository?: string;
  readonly commit?: string;
  readonly runUrl?: string;
}

export interface IngestionEvent<Payload = unknown> {
  readonly topic: string;
  readonly schemaVersion: number;
  readonly producedAt: string;
  readonly producer: string;
  readonly source?: IngestionEventSource;
  readonly payload: Payload;
}

export type IngestionPayloadSchema = Readonly<Record<string, unknown>>;

export interface IngestionTopicContract<Payload> {
  readonly topic: string;
  readonly schemaVersion: number;
  readonly description: string;
  readonly payloadSchema: IngestionPayloadSchema;
  readonly parsePayload: (value: unknown) => Payload;
}
