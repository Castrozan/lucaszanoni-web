import { useEffect, useState } from "react";

const ACTIVATION_LINE_VIEWPORT_FRACTION = 0.35;

export function resolveActiveSectionId(
  sectionIds: readonly string[],
  activationLine: number,
): string {
  let activeSectionId = sectionIds[0] ?? "";
  for (const sectionId of sectionIds) {
    const element = document.getElementById(sectionId);
    if (element && element.getBoundingClientRect().top <= activationLine) {
      activeSectionId = sectionId;
    }
  }
  return activeSectionId;
}

export function useActiveLandingSection(sectionIds: readonly string[]): string {
  const [activeSectionId, setActiveSectionId] = useState(sectionIds[0] ?? "");
  useEffect(() => {
    function syncActiveSection() {
      setActiveSectionId(
        resolveActiveSectionId(
          sectionIds,
          window.innerHeight * ACTIVATION_LINE_VIEWPORT_FRACTION,
        ),
      );
    }
    syncActiveSection();
    window.addEventListener("scroll", syncActiveSection, { passive: true });
    window.addEventListener("resize", syncActiveSection);
    return () => {
      window.removeEventListener("scroll", syncActiveSection);
      window.removeEventListener("resize", syncActiveSection);
    };
  }, [sectionIds]);
  return activeSectionId;
}
