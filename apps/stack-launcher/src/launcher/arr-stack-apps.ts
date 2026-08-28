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

export const arrStackApps: readonly ArrStackApp[] = [
  CustomDomainApp("jellyfin", "Jellyfin", 8096, "watch"),
  CustomDomainApp("jellyseerr", "Jellyseerr", 5055, "request"),
  CustomDomainApp("kavita", "Kavita", 5000, "read"),
  CustomDomainApp("stremio", "Stremio", 43212, "stream", "/setup"),
  CustomDomainApp("miwayomi", "Miwayomi", 4568, "anime"),
  CustomDomainApp("radarr", "Radarr", 7878, "radarr"),
  CustomDomainApp("sonarr", "Sonarr", 8989, "sonarr"),
  CustomDomainApp("prowlarr", "Prowlarr", 9696, "prowlarr"),
  CustomDomainApp("bazarr", "Bazarr", 6767, "bazarr"),
  CustomDomainApp("suwayomi", "Suwayomi", 4567, "suwayomi"),
  CustomDomainApp("qbittorrent", "qBittorrent", 8080, "qbittorrent"),
];
