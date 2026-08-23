import type { ArrStackApp } from "./arr-stack-apps";

const FUNNEL_DEFAULT_PORT = 443;
const HTTP_DEFAULT_PORT = 80;

export function resolveArrStackPublicDomain(): string {
  const configuredDomain = import.meta.env.VITE_ARR_STACK_PUBLIC_DOMAIN;
  if (typeof configuredDomain === "string" && configuredDomain.trim() !== "") {
    return configuredDomain.trim();
  }
  return typeof window === "undefined" ? "" : window.location.hostname;
}

export function resolveArrStackFunnelHost(): string {
  const configuredHost = import.meta.env.VITE_ARR_STACK_HOST;
  if (typeof configuredHost === "string") {
    return configuredHost.trim();
  }
  return "";
}

export function resolveArrStackTailnetHost(): string {
  const configuredHost = import.meta.env.VITE_ARR_STACK_TAILNET_HOST;
  if (typeof configuredHost === "string") {
    return configuredHost.trim();
  }
  return "";
}

export function buildArrStackAppUrl(app: ArrStackApp): string {
  if (app.exposure === "custom-domain") {
    return `https://${app.subdomainLabel}.${resolveArrStackPublicDomain()}`;
  }

  if (app.exposure === "funnel") {
    const funnelHost = resolveArrStackFunnelHost();
    const funnelPort = app.funnelPort;
    const origin =
      funnelPort === FUNNEL_DEFAULT_PORT
        ? `https://${funnelHost}`
        : `https://${funnelHost}:${funnelPort}`;
    return origin;
  }

  const tailnetHost = resolveArrStackTailnetHost();
  if (app.port === HTTP_DEFAULT_PORT) {
    return `http://${tailnetHost}`;
  }
  return `http://${tailnetHost}:${app.port}`;
}
