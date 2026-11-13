export const MAXIMUM_REQUEST_BODY_BYTES = 4_000_000;

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("the request body is larger than ingest accepts");
    this.name = "RequestBodyTooLargeError";
  }
}

function declaredContentLength(request: Request): number | undefined {
  const declared = request.headers.get("content-length");
  if (declared === null || !/^\d+$/.test(declared)) {
    return undefined;
  }
  return Number.parseInt(declared, 10);
}

export async function readBoundedRequestBody(
  request: Request,
  maximumBytes: number = MAXIMUM_REQUEST_BODY_BYTES,
): Promise<Uint8Array> {
  const declaredLength = declaredContentLength(request);
  if (declaredLength !== undefined && declaredLength > maximumBytes) {
    throw new RequestBodyTooLargeError();
  }
  if (request.body === null) {
    return new Uint8Array(0);
  }

  const reader = request.body.getReader();
  const collected = new Uint8Array(Math.min(declaredLength ?? 0, maximumBytes));
  let buffer = collected;
  let collectedByteCount = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return buffer.slice(0, collectedByteCount);
    }
    if (collectedByteCount + value.byteLength > maximumBytes) {
      await reader.cancel();
      throw new RequestBodyTooLargeError();
    }
    if (collectedByteCount + value.byteLength > buffer.byteLength) {
      const grown = new Uint8Array(
        Math.min(
          maximumBytes,
          Math.max(
            buffer.byteLength * 2,
            collectedByteCount + value.byteLength,
          ),
        ),
      );
      grown.set(buffer.subarray(0, collectedByteCount));
      buffer = grown;
    }
    buffer.set(value, collectedByteCount);
    collectedByteCount += value.byteLength;
  }
}
