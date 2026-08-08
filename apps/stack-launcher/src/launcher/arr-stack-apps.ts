export interface ArrStackApp {
  readonly id: string;
  readonly label: string;
  readonly port: number;
}

export const arrStackApps: readonly ArrStackApp[] = [
  { id: "jellyfin", label: "Jellyfin", port: 8096 },
  { id: "jellyseerr", label: "Jellyseerr", port: 5055 },
  { id: "kavita", label: "Kavita", port: 5000 },
  { id: "radarr", label: "Radarr", port: 7878 },
  { id: "sonarr", label: "Sonarr", port: 8989 },
  { id: "prowlarr", label: "Prowlarr", port: 9696 },
  { id: "bazarr", label: "Bazarr", port: 6767 },
  { id: "suwayomi", label: "Suwayomi", port: 4567 },
  { id: "qbittorrent", label: "qBittorrent", port: 8080 },
  { id: "homepage", label: "Homepage", port: 80 },
];
