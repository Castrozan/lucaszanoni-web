import {
  buildCommandPaletteDestinations,
  deduplicateDestinationsByHref,
  type PaletteDestination,
} from "@platform/design-system";

const shellNavigationDestinations: readonly PaletteDestination[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "section-sections", label: "Sections", href: "/#sections" },
  { id: "section-showcase", label: "Showcase", href: "/#showcase" },
  { id: "section-about-atrium", label: "About Atrium", href: "/#about-atrium" },
  { id: "page-about", label: "About page", href: "/about" },
  { id: "page-catalog", label: "Catalog", href: "/catalog" },
];

export function buildShellCommandPaletteDestinations(): PaletteDestination[] {
  return deduplicateDestinationsByHref([
    ...shellNavigationDestinations,
    ...buildCommandPaletteDestinations(),
  ]);
}
