export interface IngestRequest {
  readonly method: string;
  readonly pathname: string;
  readonly presentedProducerSecret: string | undefined;
  readonly contentType: string | undefined;
  readonly body: Uint8Array;
}

export interface IngestResponse {
  readonly statusCode: number;
  readonly body: Readonly<Record<string, unknown>>;
}

export function refuse(statusCode: number, error: string): IngestResponse {
  return { statusCode, body: { error } };
}
