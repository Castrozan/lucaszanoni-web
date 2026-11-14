export type GuardedRequestRefusalStatus = 400 | 403 | 413 | 415;

export type GuardedRequestBodyReading =
  | Readonly<{ status: "read"; text: string }>
  | Readonly<{ status: "refused"; refusalStatus: GuardedRequestRefusalStatus }>;

export async function readGuardedJsonRequestBody(
  request: Request,
  maximumBodyBytes: number,
): Promise<GuardedRequestBodyReading> {
  if (isCrossSiteRequest(request))
    return { status: "refused", refusalStatus: 403 };
  if (!isJsonRequest(request)) return { status: "refused", refusalStatus: 415 };
  return readBoundedBodyText(request, maximumBodyBytes);
}

export function createGenerationRefusalResponse(
  status: number,
  text: string,
): Response {
  return new Response(text, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      ...(status === 429 ? { "retry-after": "60" } : {}),
    },
  });
}

function isCrossSiteRequest(request: Request): boolean {
  return (
    request.headers.get("sec-fetch-site")?.trim().toLowerCase() === "cross-site"
  );
}

function isJsonRequest(request: Request): boolean {
  const mediaType = request.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();
  return mediaType === "application/json";
}

async function readBoundedBodyText(
  request: Request,
  maximumBodyBytes: number,
): Promise<GuardedRequestBodyReading> {
  const reader = request.body?.getReader();
  if (!reader) return { status: "read", text: "" };

  const decoder = new TextDecoder("utf-8", { fatal: true });
  const decodedChunks: string[] = [];
  let receivedBytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > maximumBodyBytes) {
        void reader.cancel().catch(() => undefined);
        return { status: "refused", refusalStatus: 413 };
      }
      decodedChunks.push(decoder.decode(value, { stream: true }));
    }
    decodedChunks.push(decoder.decode());
  } catch {
    void reader.cancel().catch(() => undefined);
    return { status: "refused", refusalStatus: 400 };
  } finally {
    reader.releaseLock();
  }
  return { status: "read", text: decodedChunks.join("") };
}
