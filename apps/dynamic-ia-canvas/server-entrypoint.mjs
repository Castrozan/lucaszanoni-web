import { createServer } from "node:http";
import next from "next";

const serverListenPort = Number.parseInt(process.env.PORT ?? "8080", 10);
const serverListenHost = "0.0.0.0";
const healthCheckRequestPath = "/livez";

const edgeSharedSecretHeaderName =
  process.env.EDGE_SHARED_SECRET_HEADER_NAME?.toLowerCase();
const edgeSharedSecretValue = process.env.EDGE_SHARED_SECRET_VALUE;

const nextApplication = next({ dir: process.cwd() });
const nextRequestHandler = nextApplication.getRequestHandler();

function requestPathnameWithoutQuery(requestUrl) {
  const queryStringStartIndex = requestUrl.indexOf("?");
  return queryStringStartIndex === -1
    ? requestUrl
    : requestUrl.slice(0, queryStringStartIndex);
}

function respondWithHealthCheckOk(response) {
  response.statusCode = 200;
  response.setHeader("content-type", "text/plain; charset=utf-8");
  response.end("ok");
}

function respondWithForbidden(response) {
  response.statusCode = 403;
  response.setHeader("content-type", "text/plain; charset=utf-8");
  response.end("forbidden");
}

function requestCarriesValidEdgeSharedSecret(request) {
  if (!edgeSharedSecretHeaderName || !edgeSharedSecretValue) {
    return false;
  }
  return request.headers[edgeSharedSecretHeaderName] === edgeSharedSecretValue;
}

await nextApplication.prepare();

const httpServer = createServer((request, response) => {
  const requestPathname = requestPathnameWithoutQuery(request.url ?? "/");

  if (request.method === "GET" && requestPathname === healthCheckRequestPath) {
    respondWithHealthCheckOk(response);
    return;
  }

  if (!requestCarriesValidEdgeSharedSecret(request)) {
    respondWithForbidden(response);
    return;
  }

  nextRequestHandler(request, response);
});

httpServer.listen(serverListenPort, serverListenHost);
