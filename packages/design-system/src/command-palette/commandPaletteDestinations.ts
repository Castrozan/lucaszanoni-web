import { MICRO_FRONTEND_ROUTES } from "@platform/config";

export interface PaletteDestination {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

const REPOSITORY_URL = "https://github.com/Castrozan/lucaszanoni-web";

const navigationDestinations: readonly PaletteDestination[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "section-sections", label: "Sections", href: "/#sections" },
  { id: "section-showcase", label: "Showcase", href: "/#showcase" },
  { id: "section-about-atrium", label: "About Atrium", href: "/#about-atrium" },
  { id: "page-about", label: "About page", href: "/about" },
  { id: "page-catalog", label: "Catalog", href: "/catalog" },
];

function deduplicateByHref(
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
  return deduplicateByHref([
    ...navigationDestinations,
    ...appDestinations,
    { id: "source", label: "Source (GitHub)", href: REPOSITORY_URL },
  ]);
}
