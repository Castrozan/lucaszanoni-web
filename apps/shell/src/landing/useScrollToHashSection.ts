import { useEffect } from "react";

export function readHashSectionId(
  hash: string,
  sectionIds: readonly string[],
): string | null {
  const candidate = hash.startsWith("#") ? hash.slice(1) : hash;
  return sectionIds.includes(candidate) ? candidate : null;
}

export function useScrollToHashSection(sectionIds: readonly string[]): void {
  useEffect(() => {
    function scrollToHashSection() {
      const sectionId = readHashSectionId(window.location.hash, sectionIds);
      if (sectionId === null) {
        return;
      }
      document.getElementById(sectionId)?.scrollIntoView({ block: "start" });
    }
    scrollToHashSection();
    window.addEventListener("hashchange", scrollToHashSection);
    return () => {
      window.removeEventListener("hashchange", scrollToHashSection);
    };
  }, [sectionIds]);
}
