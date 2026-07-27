import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import {
  readHashSectionId,
  useScrollToHashSection,
} from "../src/landing/useScrollToHashSection";

const KNOWN_SECTION_IDS = ["hero", "cockpit"] as const;

function ScrollToHashSectionHost() {
  useScrollToHashSection(KNOWN_SECTION_IDS);
  return (
    <div>
      {KNOWN_SECTION_IDS.map((sectionId) => (
        <div key={sectionId} id={sectionId} />
      ))}
    </div>
  );
}

const originalScrollIntoView = Element.prototype.scrollIntoView;

afterEach(() => {
  cleanup();
  window.location.hash = "";
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

describe("readHashSectionId", () => {
  it("returns the id for a hash carrying the leading hash mark", () => {
    expect(readHashSectionId("#cockpit", KNOWN_SECTION_IDS)).toBe("cockpit");
  });

  it("tolerates a hash passed without the leading hash mark", () => {
    expect(readHashSectionId("cockpit", KNOWN_SECTION_IDS)).toBe("cockpit");
  });

  it("returns null for an unknown fragment", () => {
    expect(readHashSectionId("#unknown", KNOWN_SECTION_IDS)).toBeNull();
  });

  it("returns null for an empty hash", () => {
    expect(readHashSectionId("", KNOWN_SECTION_IDS)).toBeNull();
  });
});

describe("useScrollToHashSection", () => {
  it("scrolls the section matching the initial hash into view on mount", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    window.location.hash = "#cockpit";

    render(<ScrollToHashSectionHost />);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
  });

  it("scrolls the section matching the hash on a dispatched hashchange event", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    window.location.hash = "";

    render(<ScrollToHashSectionHost />);
    scrollIntoView.mockClear();
    window.location.hash = "#hero";
    window.dispatchEvent(new Event("hashchange"));

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
  });

  it("does nothing for an unknown fragment", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    window.location.hash = "#unknown";

    render(<ScrollToHashSectionHost />);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
