export interface ArrStackApp {
  readonly id: string;
  readonly label: string;
  readonly port: number;
}

export const arrStackApps: readonly ArrStackApp[] = [
  { id: "jellyfin", label: "Jellyfin", port: 8096 },
  { id: "jellyseerr", label: "Jellyseerr", port: 5055 },
  { id: "radarr", label: "Radarr", port: 7878 },
  { id: "sonarr", label: "Sonarr", port: 8989 },
  { id: "prowlarr", label: "Prowlarr", port: 9696 },
  { id: "lidarr", label: "Lidarr", port: 8686 },
  { id: "readarr", label: "Readarr", port: 8788 },
  { id: "bazarr", label: "Bazarr", port: 6767 },
  { id: "qbittorrent", label: "qBittorrent", port: 8080 },
  { id: "homepage", label: "Homepage", port: 80 },
];
