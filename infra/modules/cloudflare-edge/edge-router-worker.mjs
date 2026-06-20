const selectOriginHost = (requestPath, routingTable) => {
  const matchedRoute = routingTable.prefixes.find((route) =>
    requestPath.startsWith(route.prefix),
  );
  return matchedRoute ? matchedRoute.host : routingTable.shell;
};

export default {
  async fetch(request, env) {
    const routingTable = JSON.parse(env.EDGE_ROUTES);
    const incomingUrl = new URL(request.url);
    const originHost = selectOriginHost(incomingUrl.pathname, routingTable);

    const originUrl = new URL(request.url);
    originUrl.hostname = originHost;

    const originRequest = new Request(originUrl, request);
    originRequest.headers.set(
      env.EDGE_SHARED_SECRET_HEADER_NAME,
      env.EDGE_SHARED_SECRET,
    );

    return fetch(originRequest);
  },
};
