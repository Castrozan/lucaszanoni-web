export type ArrStackAppExposure = "custom-domain" | "tailnet";

interface ArrStackAppBase {
  readonly id: string;
  readonly label: string;
  readonly launchPath?: string;
  readonly port: number;
}

export type ArrStackApp = ArrStackAppBase &
  (
    | { readonly exposure: "custom-domain"; readonly subdomainLabel: string }
    | { readonly exposure: "tailnet" }
  );

const CustomDomainApp = (
  id: string,
  label: string,
  port: number,
  subdomainLabel: string,
  launchPath?: string,
): ArrStackApp => ({
  id,
  label,
  exposure: "custom-domain",
  launchPath,
  port,
  subdomainLabel,
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
  CustomDomainApp("kavita", "Kavita", 5000, "read"),
  CustomDomainApp("stremio", "Stremio", 43212, "stream", "/setup"),
  TailnetApp("seanime", "Seanime", 43211),
  TailnetApp("radarr", "Radarr", 7878),
  TailnetApp("sonarr", "Sonarr", 8989),
  TailnetApp("prowlarr", "Prowlarr", 9696),
  TailnetApp("bazarr", "Bazarr", 6767),
  TailnetApp("suwayomi", "Suwayomi", 4567),
  TailnetApp("qbittorrent", "qBittorrent", 8080),
];
