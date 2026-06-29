import { MICRO_FRONTEND_ROUTES } from "@platform/config";
import type { PaletteCommand } from "./useCommandPalette";

export interface PaletteDestination {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

export function destinationsToCommands(
  destinations: readonly PaletteDestination[],
  navigate: (href: string) => void,
): PaletteCommand[] {
  return destinations.map((destination) => ({
    id: destination.id,
    title: destination.label,
    hint: destination.href,
    run: () => navigate(destination.href),
  }));
}

const REPOSITORY_URL = "https://github.com/Castrozan/lucaszanoni-web";

export function deduplicateDestinationsByHref(
  destinations: readonly PaletteDestination[],
): PaletteDestination[] {
  const seenHrefs = new Set<string>();
  return destinations.filter((destination) => {
    if (seenHrefs.has(destination.href)) {
      return false;
    }
    seenHrefs.add(destination.href);
    return true;
  });
}

export function buildCommandPaletteDestinations(): PaletteDestination[] {
  const appDestinations = MICRO_FRONTEND_ROUTES.filter(
    (route) => route.id !== "shell",
  ).map((route) => ({
    id: `app-${route.id}`,
    label: route.navigationLabel,
    href: route.mountPath,
  }));
  return deduplicateDestinationsByHref([
    { id: "home", label: "Home", href: "/" },
    ...appDestinations,
    { id: "source", label: "Source (GitHub)", href: REPOSITORY_URL },
  ]);
}
