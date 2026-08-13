export type ArrStackAppExposure = "funnel" | "tailnet";

export interface ArrStackApp {
  readonly id: string;
  readonly label: string;
  readonly exposure: ArrStackAppExposure;
  readonly port: number;
  readonly funnelPort?: number;
}

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
  FunnelApp("jellyfin", "Jellyfin", 8096, 443),
  FunnelApp("jellyseerr", "Jellyseerr", 5055, 8443),
  FunnelApp("kavita", "Kavita", 5000, 10000),
  TailnetApp("seanime", "Seanime", 43211),
  TailnetApp("radarr", "Radarr", 7878),
  TailnetApp("sonarr", "Sonarr", 8989),
  TailnetApp("prowlarr", "Prowlarr", 9696),
  TailnetApp("bazarr", "Bazarr", 6767),
  TailnetApp("suwayomi", "Suwayomi", 4567),
  TailnetApp("qbittorrent", "qBittorrent", 8080),
];
