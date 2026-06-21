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

const selectExternalHttpsRoute = (requestPath, routingTable) =>
  (routingTable.externalHttpsPrefixes ?? []).find((route) =>
    requestPath.startsWith(route.prefix),
  );

const buildExternalHttpsOriginUrl = (requestUrl, externalRoute) => {
  const originUrl = new URL(requestUrl);
  originUrl.hostname = externalRoute.originHost;
  if (externalRoute.pathRewrite === "strip-mount-path") {
    const requestPathWithinMount = requestUrl.pathname.slice(
      externalRoute.prefix.length,
    );
    originUrl.pathname = `${externalRoute.forwardedBasePath}${requestPathWithinMount}`;
  }
  return originUrl;
};

const removeCookiesByName = (cookieHeaderValue, cookieNamesToRemove) => {
  const cookieNamesToRemoveSet = new Set(cookieNamesToRemove);
  return cookieHeaderValue
    .split(";")
    .map((cookiePair) => cookiePair.trim())
    .filter((cookiePair) => cookiePair.length > 0)
    .filter((cookiePair) => {
      const cookieName = cookiePair.includes("=")
        ? cookiePair.slice(0, cookiePair.indexOf("="))
        : cookiePair;
      return !cookieNamesToRemoveSet.has(cookieName);
    })
    .join("; ");
};

export default {
  async fetch(request, env) {
    const routingTable = JSON.parse(env.EDGE_ROUTES);
    const incomingUrl = new URL(request.url);

    const aliasRedirect = routingTable.aliasRedirect;
    if (aliasRedirect && incomingUrl.hostname !== aliasRedirect.canonicalHost) {
      const canonicalUrl = new URL(incomingUrl);
      canonicalUrl.hostname = aliasRedirect.canonicalHost;
      return new Response(null, {
        status: aliasRedirect.statusCode,
        headers: { Location: canonicalUrl.toString() },
      });
    }

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

    const externalHttpsRoute = selectExternalHttpsRoute(
      incomingUrl.pathname,
      routingTable,
    );
    if (externalHttpsRoute) {
      const externalOriginUrl = buildExternalHttpsOriginUrl(
        incomingUrl,
        externalHttpsRoute,
      );
      const externalOriginRequest = new Request(externalOriginUrl, request);
      externalOriginRequest.headers.delete(env.EDGE_SHARED_SECRET_HEADER_NAME);
      const incomingCookieHeader = externalOriginRequest.headers.get("Cookie");
      if (incomingCookieHeader !== null) {
        const sanitizedCookieHeader = removeCookiesByName(incomingCookieHeader, [
          "CF_Authorization",
          "CF_AppSession",
        ]);
        if (sanitizedCookieHeader.length > 0) {
          externalOriginRequest.headers.set("Cookie", sanitizedCookieHeader);
        } else {
          externalOriginRequest.headers.delete("Cookie");
        }
      }
      if (!externalHttpsRoute.trusted) {
        externalOriginRequest.headers.delete("Cf-Access-Jwt-Assertion");
      }
      return fetch(externalOriginRequest);
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
