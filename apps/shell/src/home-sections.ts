import { CROSS_SECTION_NAVIGATION_ROUTES } from "@platform/config";

export interface HomeSectionCard {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
}

export function buildHomeSectionCards(): HomeSectionCard[] {
  return CROSS_SECTION_NAVIGATION_ROUTES.map((route) => ({
    id: route.id,
    title: route.navigationLabel,
    description: route.description,
    href: route.mountPath,
  }));
}
