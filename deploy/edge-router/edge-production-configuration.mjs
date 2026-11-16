export const EDGE_ROUTER_SCRIPT_NAME = "lucaszanoni-edge-router";
export const EDGE_SHARED_SECRET_HEADER_NAME = "X-Edge-Auth";
export const EDGE_SHARED_SECRET_BINDING = "EDGE_SHARED_SECRET";
export const EDGE_WORKER_COMPATIBILITY_DATE = "2024-11-01";

const CANONICAL_DOMAIN_NAME = "lucaszanoni.com";
const ALIAS_DOMAIN_NAME = "lucaszanoni.com.br";
const ALIAS_REDIRECT_STATUS_CODE = 301;

function readProductionFlag(environment, name) {
  if (environment[name] === "true") return true;
  if (environment[name] === "false") return false;
  throw new Error(`Production edge flag ${name} must be true or false`);
}

export function createEdgeProductionConfiguration({
  dotcomCanonical,
  kiraSessionTunnel,
  rinSessionTunnel,
}) {
  return {
    servingDomain: dotcomCanonical ? CANONICAL_DOMAIN_NAME : ALIAS_DOMAIN_NAME,
    aliasRedirect: dotcomCanonical
      ? {
          canonicalHost: CANONICAL_DOMAIN_NAME,
          statusCode: ALIAS_REDIRECT_STATUS_CODE,
        }
      : null,
    cockpitSessionTunnels: {
      kira: kiraSessionTunnel,
      rin: rinSessionTunnel,
    },
  };
}

export function readEdgeProductionConfiguration(environment) {
  return createEdgeProductionConfiguration({
    dotcomCanonical: readProductionFlag(environment, "ENABLE_DOTCOM_CANONICAL"),
    kiraSessionTunnel: readProductionFlag(
      environment,
      "ENABLE_KIRA_SESSION_TUNNEL",
    ),
    rinSessionTunnel: readProductionFlag(
      environment,
      "ENABLE_RIN_SESSION_TUNNEL",
    ),
  });
}
