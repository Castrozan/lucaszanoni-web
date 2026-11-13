import { PRODUCER_SECRET_HEADER_NAME } from "../ingest-producer-authorization";
import type { IngestRequest, IngestResponse } from "../ingest-request-handler";
import {
  RequestBodyTooLargeError,
  readBoundedRequestBody,
} from "./bounded-request-body";

function respondWithJson(
  statusCode: number,
  body: Readonly<Record<string, unknown>>,
): Response {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function createIngestFetchHandler(
  handleIngestRequest: (request: IngestRequest) => Promise<IngestResponse>,
): (request: Request) => Promise<Response> {
  return async function handleFetch(request) {
    try {
      const ingestResponse = await handleIngestRequest({
        method: request.method,
        pathname: new URL(request.url).pathname,
        presentedProducerSecret:
          request.headers.get(PRODUCER_SECRET_HEADER_NAME) ?? undefined,
        contentType: request.headers.get("content-type") ?? undefined,
        body: await readBoundedRequestBody(request),
      });
      return respondWithJson(ingestResponse.statusCode, ingestResponse.body);
    } catch (failure) {
      if (failure instanceof RequestBodyTooLargeError) {
        return respondWithJson(413, { error: failure.message });
      }
      return respondWithJson(500, { error: String(failure) });
    }
  };
}
