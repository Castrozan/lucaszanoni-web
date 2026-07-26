export const HERO_SECTION_ID = "hero";
export const COCKPIT_SECTION_ID = "cockpit";
export const SHOWCASE_SECTION_ID = "showcase";
export const ABOUT_SECTION_ID = "about";

export interface LandingSection {
  readonly id: string;
  readonly label: string;
}

export const LANDING_SECTIONS: readonly LandingSection[] = [
  { id: HERO_SECTION_ID, label: "Hero" },
  { id: COCKPIT_SECTION_ID, label: "Cockpit" },
  { id: SHOWCASE_SECTION_ID, label: "Showcase" },
  { id: ABOUT_SECTION_ID, label: "About" },
];

export const LANDING_SECTION_IDS: readonly string[] = LANDING_SECTIONS.map(
  (section) => section.id,
);
