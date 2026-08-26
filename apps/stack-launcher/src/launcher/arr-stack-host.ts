import type { ArrStackApp } from "./arr-stack-apps";

const HTTP_DEFAULT_PORT = 80;

export type ArrStackAppLinkExposure = "cloudflare" | "tailscale";

export interface ArrStackAppLink {
  readonly exposure: ArrStackAppLinkExposure;
  readonly url: string;
}

export function arrStackAppLinkExposureLabel(
  exposure: ArrStackAppLinkExposure,
): string {
  return exposure === "cloudflare" ? "Cloudflare" : "Tailscale";
}

export function resolveArrStackPublicDomain(): string {
  const configuredDomain = import.meta.env.VITE_ARR_STACK_PUBLIC_DOMAIN;
  if (typeof configuredDomain === "string" && configuredDomain.trim() !== "") {
    return configuredDomain.trim();
  }
  return typeof window === "undefined" ? "" : window.location.hostname;
}

export function resolveArrStackTailnetHost(): string {
  const configuredHost = import.meta.env.VITE_ARR_STACK_TAILNET_HOST;
  if (typeof configuredHost === "string") {
    return configuredHost.trim();
  }
  return "";
}

function buildTailnetUrl(app: ArrStackApp, tailnetHost: string): string {
  const launchPath = app.launchPath ?? "";
  if (app.port === HTTP_DEFAULT_PORT) {
    return `http://${tailnetHost}${launchPath}`;
  }
  return `http://${tailnetHost}:${app.port}${launchPath}`;
}

export function buildArrStackAppLinks(
  app: ArrStackApp,
): readonly ArrStackAppLink[] {
  const links: ArrStackAppLink[] = [];
  const launchPath = app.launchPath ?? "";
  if (app.exposure === "custom-domain") {
    const publicDomain = resolveArrStackPublicDomain();
    if (publicDomain.length > 0) {
      links.push({
        exposure: "cloudflare",
        url: `https://${app.subdomainLabel}.${publicDomain}${launchPath}`,
      });
    }
  }

  const tailnetHost = resolveArrStackTailnetHost();
  if (tailnetHost.length > 0) {
    links.push({
      exposure: "tailscale",
      url: buildTailnetUrl(app, tailnetHost),
    });
  }

  return links;
}
