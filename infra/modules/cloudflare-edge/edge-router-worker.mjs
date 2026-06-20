const selectStaticBucketRoute = (requestPath, routingTable) =>
  (routingTable.staticBucketPrefixes ?? []).find((route) =>
    requestPath.startsWith(route.prefix),
  );

const selectCloudRunOriginHost = (requestPath, routingTable) => {
  const matchedRoute = routingTable.prefixes.find((route) =>
    requestPath.startsWith(route.prefix),
  );
  return matchedRoute ? matchedRoute.host : routingTable.shell;
};

const buildStaticBucketObjectUrl = (requestUrl, staticBucketRoute) => {
  const objectKeyWithinPrefix = requestUrl.pathname.slice(
    staticBucketRoute.prefix.length,
  );
  const objectKey = `${staticBucketRoute.objectKeyPrefix}${objectKeyWithinPrefix}`;
  const objectKeyWithDirectoryIndex = objectKey.endsWith("/")
    ? `${objectKey}index.html`
    : objectKey;

  const objectUrl = new URL(requestUrl);
  objectUrl.hostname = "storage.googleapis.com";
  objectUrl.pathname = `/${staticBucketRoute.bucket}/${objectKeyWithDirectoryIndex}`;
  return objectUrl;
};

export default {
  async fetch(request, env) {
    const routingTable = JSON.parse(env.EDGE_ROUTES);
    const incomingUrl = new URL(request.url);

    const staticBucketRoute = selectStaticBucketRoute(
      incomingUrl.pathname,
      routingTable,
    );
    if (staticBucketRoute) {
      const objectUrl = buildStaticBucketObjectUrl(
        incomingUrl,
        staticBucketRoute,
      );
      return fetch(new Request(objectUrl, request));
    }

    const originUrl = new URL(request.url);
    originUrl.hostname = selectCloudRunOriginHost(
      incomingUrl.pathname,
      routingTable,
    );

    const originRequest = new Request(originUrl, request);
    originRequest.headers.set(
      env.EDGE_SHARED_SECRET_HEADER_NAME,
      env.EDGE_SHARED_SECRET,
    );

    return fetch(originRequest);
  },
};
