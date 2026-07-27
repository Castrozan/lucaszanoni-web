import { afterEach, describe, expect, it } from "vitest";
import { resolveActiveSectionId } from "../src/landing/useActiveLandingSection";

afterEach(() => {
  document.body.innerHTML = "";
});

function appendSectionElementWithTop(id: string, top: number): void {
  const sectionElement = document.createElement("div");
  sectionElement.id = id;
  sectionElement.getBoundingClientRect = () => ({
    top,
    bottom: top,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: top,
    toJSON: () => ({ top }),
  });
  document.body.appendChild(sectionElement);
}

describe("resolveActiveSectionId", () => {
  it("picks the last section in the list whose top has crossed the activation line", () => {
    appendSectionElementWithTop("first-section", -200);
    appendSectionElementWithTop("second-section", -100);
    appendSectionElementWithTop("third-section", 10);
    appendSectionElementWithTop("fourth-section", 999);

    const activeSectionId = resolveActiveSectionId(
      ["first-section", "second-section", "third-section", "fourth-section"],
      50,
    );

    expect(activeSectionId).toBe("third-section");
  });

  it("falls back to the first section id when no section has crossed the activation line", () => {
    appendSectionElementWithTop("first-section", 500);
    appendSectionElementWithTop("second-section", 600);

    const activeSectionId = resolveActiveSectionId(
      ["first-section", "second-section"],
      50,
    );

    expect(activeSectionId).toBe("first-section");
  });

  it("skips a section id that has no matching element instead of throwing", () => {
    appendSectionElementWithTop("present-section", 10);

    expect(() =>
      resolveActiveSectionId(["missing-section", "present-section"], 50),
    ).not.toThrow();
    expect(
      resolveActiveSectionId(["missing-section", "present-section"], 50),
    ).toBe("present-section");
  });
});
