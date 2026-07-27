import { BottomStatusBar, type StatusBarModel } from "@platform/design-system";
import { LANDING_SECTIONS, LANDING_SECTION_IDS } from "./landingSections";
import { useActiveLandingSection } from "./useActiveLandingSection";

const LANDING_SESSION_LABEL = "Atrium";

function scrollToSection(sectionId: string): void {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function buildLandingStatusBarModel(
  activeSectionId: string,
): StatusBarModel {
  return {
    sessionLabel: LANDING_SESSION_LABEL,
    windows: LANDING_SECTIONS.map((section) => ({
      kind: "action",
      id: section.id,
      label: section.label,
      isActive: section.id === activeSectionId,
      onSelect: () => scrollToSection(section.id),
    })),
  };
}

export function LandingStatusBar() {
  const activeSectionId = useActiveLandingSection(LANDING_SECTION_IDS);
  return (
    <BottomStatusBar model={buildLandingStatusBarModel(activeSectionId)} />
  );
}
