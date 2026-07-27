import {
  buildCommandPaletteDestinations,
  deduplicateDestinationsByHref,
  type PaletteDestination,
} from "@platform/design-system";

const shellPageDestinations: readonly PaletteDestination[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "page-about", label: "About page", href: "/about" },
  { id: "page-catalog", label: "Catalog", href: "/catalog" },
];

export function buildShellCommandPaletteDestinations(): PaletteDestination[] {
  return deduplicateDestinationsByHref([
    ...shellPageDestinations,
    ...buildCommandPaletteDestinations(),
  ]);
}
