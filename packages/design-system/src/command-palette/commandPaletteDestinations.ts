import { MICRO_FRONTEND_ROUTES } from "@platform/config";

export interface PaletteDestination {
  readonly id: string;
  readonly label: string;
  readonly href: string;
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
