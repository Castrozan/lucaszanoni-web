export type ArrStackAppExposure = "custom-domain" | "funnel" | "tailnet";

interface ArrStackAppBase {
  readonly id: string;
  readonly label: string;
  readonly port: number;
}

export type ArrStackApp = ArrStackAppBase &
  (
    | { readonly exposure: "custom-domain"; readonly subdomainLabel: string }
    | { readonly exposure: "funnel"; readonly funnelPort: number }
    | { readonly exposure: "tailnet" }
  );

const CustomDomainApp = (
  id: string,
  label: string,
  port: number,
  subdomainLabel: string,
): ArrStackApp => ({
  id,
  label,
  exposure: "custom-domain",
  port,
  subdomainLabel,
});

const FunnelApp = (
  id: string,
  label: string,
  port: number,
  funnelPort: number,
): ArrStackApp => ({
  id,
  label,
  exposure: "funnel",
  port,
  funnelPort,
});

const TailnetApp = (id: string, label: string, port: number): ArrStackApp => ({
  id,
  label,
  exposure: "tailnet",
  port,
});

export const arrStackApps: readonly ArrStackApp[] = [
  CustomDomainApp("jellyfin", "Jellyfin", 8096, "watch"),
  CustomDomainApp("jellyseerr", "Jellyseerr", 5055, "request"),
  FunnelApp("kavita", "Kavita", 5000, 10000),
  TailnetApp("seanime", "Seanime", 43211),
  TailnetApp("radarr", "Radarr", 7878),
  TailnetApp("sonarr", "Sonarr", 8989),
  TailnetApp("prowlarr", "Prowlarr", 9696),
  TailnetApp("bazarr", "Bazarr", 6767),
  TailnetApp("suwayomi", "Suwayomi", 4567),
  TailnetApp("qbittorrent", "qBittorrent", 8080),
];
