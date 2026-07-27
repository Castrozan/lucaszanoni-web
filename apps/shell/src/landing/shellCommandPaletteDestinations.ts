import {
  buildCommandPaletteDestinations,
  deduplicateDestinationsByHref,
  type PaletteDestination,
} from "@platform/design-system";
import { LANDING_SECTIONS } from "./landingSections";

const shellPageDestinations: readonly PaletteDestination[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "page-about", label: "About page", href: "/about" },
  { id: "page-catalog", label: "Catalog", href: "/catalog" },
];

const landingSectionDestinations: readonly PaletteDestination[] =
  LANDING_SECTIONS.map((section) => ({
    id: `section-${section.id}`,
    label: `${section.label} section`,
    href: `/#${section.id}`,
  }));

export function buildShellCommandPaletteDestinations(): PaletteDestination[] {
  return deduplicateDestinationsByHref([
    ...shellPageDestinations,
    ...landingSectionDestinations,
    ...buildCommandPaletteDestinations(),
  ]);
}
