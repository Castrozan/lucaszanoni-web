const servesOnSubdomain = (application) =>
  application.servingLocation?.kind === "subdomain";

const compareLexically = (left, right) =>
  left < right ? -1 : left > right ? 1 : 0;

const externalHttpsRoute = ({
  prefix,
  originHost,
  pathRewrite,
  forwardedBasePath,
  trusted,
}) => ({ forwardedBasePath, originHost, pathRewrite, prefix, trusted });

function cockpitSessionRoutes({ servingDomain, cockpitSessionTunnels }) {
  const sessionTunnelRoute = (machineName) =>
    externalHttpsRoute({
      prefix: `/cockpit/${machineName}-session/`,
      originHost: `${machineName}-session-origin.${servingDomain}`,
      pathRewrite: "strip-mount-path",
      forwardedBasePath: "/cockpit/",
      trusted: false,
    });
  return [
    externalHttpsRoute({
      prefix: "/cockpit/lifecycle",
      originHost: `jarvis-session-origin.${servingDomain}`,
      pathRewrite: "preserve",
      forwardedBasePath: "",
      trusted: false,
    }),
    ...Object.entries(cockpitSessionTunnels)
      .filter(([, enabled]) => enabled)
      .map(([machineName]) => sessionTunnelRoute(machineName)),
  ];
}

function externalHttpsPrefixes(registry, configuration) {
  const routesByPrefix = new Map();
  for (const application of registry) {
    if (
      application.origin.kind !== "external-https" ||
      servesOnSubdomain(application)
    )
      continue;
    routesByPrefix.set(
      application.mountPath,
      externalHttpsRoute({
        prefix: application.mountPath,
        ...application.origin,
      }),
    );
  }
  for (const route of cockpitSessionRoutes(configuration))
    routesByPrefix.set(route.prefix, route);
  return [...routesByPrefix.values()].sort((left, right) =>
    compareLexically(left.prefix, right.prefix),
  );
}

function subdomainRoutes(registry, { servingDomain }) {
  return registry
    .filter(servesOnSubdomain)
    .sort((left, right) =>
      compareLexically(
        left.servingLocation.subdomainLabel,
        right.servingLocation.subdomainLabel,
      ),
    )
    .map((application) => ({
      host: `${application.servingLocation.subdomainLabel}.${servingDomain}`,
      originHost: application.origin.originHost,
      trusted: application.origin.trusted ?? false,
    }));
}

export function createEdgeRoutingTable({
  registry,
  workerServiceRoutes,
  configuration,
}) {
  return {
    aliasRedirect: configuration.aliasRedirect,
    externalHttpsPrefixes: externalHttpsPrefixes(registry, configuration),
    retiredPrefixes: registry
      .filter((application) => application.status === "retired")
      .map((application) => ({ prefix: application.mountPath })),
    subdomains: subdomainRoutes(registry, configuration),
    workerServicePrefixes: workerServiceRoutes.map(({ prefix, binding }) => ({
      prefix,
      binding,
    })),
  };
}
