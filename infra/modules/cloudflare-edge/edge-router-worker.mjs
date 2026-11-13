const requestPathMatchesMountPrefix = (requestPath, mountPrefix) =>
  requestPath.startsWith(mountPrefix) ||
  (mountPrefix.endsWith("/") && requestPath === mountPrefix.slice(0, -1));
const selectRetiredRoute = (requestPath, routingTable) =>
  (routingTable.retiredPrefixes ?? []).find((route) =>
    requestPathMatchesMountPrefix(requestPath, route.prefix),
  );
const selectApplicationRoute = (requestPath, routingTable) => {
  const routes = [
    ...(routingTable.workerServicePrefixes ?? []),
    ...routingTable.prefixes,
    ...(routingTable.shell ? [{ prefix: "/", host: routingTable.shell }] : []),
  ];
  return routes
    .sort((left, right) => right.prefix.length - left.prefix.length)
    .find((route) => requestPathMatchesMountPrefix(requestPath, route.prefix));
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

const cloudflareAccessSessionCookieNames = [
  "CF_Authorization",
  "CF_AppSession",
];

const stripCloudflareAccessSessionCookies = (originRequest) => {
  const incomingCookieHeader = originRequest.headers.get("Cookie");
  if (incomingCookieHeader === null) {
    return;
  }
  const sanitizedCookieHeader = removeCookiesByName(
    incomingCookieHeader,
    cloudflareAccessSessionCookieNames,
  );
  if (sanitizedCookieHeader.length > 0) {
    originRequest.headers.set("Cookie", sanitizedCookieHeader);
  } else {
    originRequest.headers.delete("Cookie");
  }
};

const selectSubdomainRoute = (requestHost, routingTable) =>
  (routingTable.subdomains ?? []).find((route) => route.host === requestHost);

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

    const subdomainRoute = selectSubdomainRoute(
      incomingUrl.hostname,
      routingTable,
    );
    if (subdomainRoute) {
      const subdomainOriginUrl = new URL(request.url);
      subdomainOriginUrl.hostname = subdomainRoute.originHost;
      const subdomainOriginRequest = new Request(subdomainOriginUrl, request);
      stripCloudflareAccessSessionCookies(subdomainOriginRequest);
      if (subdomainRoute.originKind === "cloud-run") {
        subdomainOriginRequest.headers.set(
          env.EDGE_SHARED_SECRET_HEADER_NAME,
          env.EDGE_SHARED_SECRET,
        );
      } else {
        subdomainOriginRequest.headers.delete(
          env.EDGE_SHARED_SECRET_HEADER_NAME,
        );
        if (!subdomainRoute.trusted) {
          subdomainOriginRequest.headers.delete("Cf-Access-Jwt-Assertion");
        }
      }
      return fetch(subdomainOriginRequest);
    }

    const retiredRoute = selectRetiredRoute(incomingUrl.pathname, routingTable);
    if (retiredRoute) {
      return new Response("This application has been retired.\n", {
        status: 410,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
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
      stripCloudflareAccessSessionCookies(externalOriginRequest);
      if (!externalHttpsRoute.trusted) {
        externalOriginRequest.headers.delete("Cf-Access-Jwt-Assertion");
      }
      return fetch(externalOriginRequest);
    }

    const applicationRoute = selectApplicationRoute(
      incomingUrl.pathname,
      routingTable,
    );
    if (!applicationRoute) {
      return new Response("Application route is not configured", {
        status: 503,
      });
    }
    if (applicationRoute.binding) {
      const applicationService = env[applicationRoute.binding];
      if (!applicationService) {
        return new Response("Application service is not bound", {
          status: 503,
        });
      }
      return applicationService.fetch(request);
    }
    const originUrl = new URL(request.url);
    originUrl.hostname = applicationRoute.host;

    const originRequest = new Request(originUrl, request);
    originRequest.headers.set(
      env.EDGE_SHARED_SECRET_HEADER_NAME,
      env.EDGE_SHARED_SECRET,
    );

    return fetch(originRequest);
  },
};
