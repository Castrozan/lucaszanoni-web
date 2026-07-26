import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { PRODUCER_SECRET_HEADER_NAME } from "./ingest-producer-authorization";
import type { IngestRequest, IngestResponse } from "./ingest-request-handler";
import { HEALTH_PROBE_PATH } from "./ingest-request-target";

const MAXIMUM_REQUEST_BODY_BYTES = 4_000_000;

export interface IngestHttpServerDependencies {
  readonly handleIngestRequest: (
    request: IngestRequest,
  ) => Promise<IngestResponse>;
  readonly edgeSharedSecretHeaderName: string | undefined;
  readonly edgeSharedSecretValue: string | undefined;
}

function requestPathnameWithoutQuery(requestUrl: string): string {
  const queryStringStartIndex = requestUrl.indexOf("?");
  return queryStringStartIndex === -1
    ? requestUrl
    : requestUrl.slice(0, queryStringStartIndex);
}

function singleHeaderValue(
  request: IncomingMessage,
  headerName: string,
): string | undefined {
  const headerValue = request.headers[headerName];
  return Array.isArray(headerValue) ? headerValue[0] : headerValue;
}

function respondWithJson(
  response: ServerResponse,
  statusCode: number,
  body: Readonly<Record<string, unknown>>,
): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body));
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const collectedChunks: Buffer[] = [];
  let collectedByteCount = 0;
  for await (const chunk of request) {
    collectedByteCount += chunk.length;
    if (collectedByteCount > MAXIMUM_REQUEST_BODY_BYTES) {
      throw new Error("the request body is larger than ingest accepts");
    }
    collectedChunks.push(chunk as Buffer);
  }
  return Buffer.concat(collectedChunks).toString("utf8");
}

function requestCarriesValidEdgeSharedSecret(
  dependencies: IngestHttpServerDependencies,
  request: IncomingMessage,
): boolean {
  const { edgeSharedSecretHeaderName, edgeSharedSecretValue } = dependencies;
  if (!edgeSharedSecretHeaderName || !edgeSharedSecretValue) {
    return false;
  }
  return (
    singleHeaderValue(request, edgeSharedSecretHeaderName) ===
    edgeSharedSecretValue
  );
}

export function createIngestHttpServer(
  dependencies: IngestHttpServerDependencies,
): Server {
  return createServer((request, response) => {
    void (async () => {
      const pathname = requestPathnameWithoutQuery(request.url ?? "/");

      if (request.method === "GET" && pathname === HEALTH_PROBE_PATH) {
        respondWithJson(response, 200, { status: "ok" });
        return;
      }

      if (!requestCarriesValidEdgeSharedSecret(dependencies, request)) {
        respondWithJson(response, 403, {
          error: "the request did not arrive through the edge",
        });
        return;
      }

      let body: string;
      try {
        body = await readRequestBody(request);
      } catch (readFailure) {
        respondWithJson(response, 413, { error: String(readFailure) });
        return;
      }

      const ingestResponse = await dependencies.handleIngestRequest({
        method: request.method ?? "GET",
        pathname,
        presentedProducerSecret: singleHeaderValue(
          request,
          PRODUCER_SECRET_HEADER_NAME,
        ),
        body,
      });
      respondWithJson(response, ingestResponse.statusCode, ingestResponse.body);
    })().catch((serverFailure: unknown) => {
      respondWithJson(response, 500, { error: String(serverFailure) });
    });
  });
}
