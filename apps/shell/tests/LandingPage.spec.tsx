import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { KeybindProvider } from "@platform/design-system";
import { LandingPage } from "../src/landing/LandingPage";
import {
  KEYBOARD_SECTION_ID,
  LANDING_SECTIONS,
} from "../src/landing/landingSections";

afterEach(cleanup);

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

function requireElementById(container: HTMLElement, id: string): Element {
  const element = container.querySelector(`#${id}`);
  if (!element) {
    throw new Error(`expected an element with id ${id}`);
  }
  return element;
}

function renderLandingPageInsideKeybindProvider() {
  return render(
    <KeybindProvider>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </KeybindProvider>,
  );
}

describe("LandingPage", () => {
  it("renders the sections in the order the status bar numbers them", () => {
    const { container } = renderLandingPage();
    const sectionElements = LANDING_SECTIONS.map((section) =>
      requireElementById(container, section.id),
    );

    for (let index = 1; index < sectionElements.length; index += 1) {
      const previousElement = sectionElements[index - 1];
      const currentElement = sectionElements[index];
      if (!previousElement || !currentElement) {
        throw new Error("expected every landing section to render");
      }
      expect(
        previousElement.compareDocumentPosition(currentElement) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("keeps the footer outside of main so it can centre itself independently", () => {
    const { container } = renderLandingPage();
    const mainElement = container.querySelector("main");
    const footerElement = container.querySelector("footer");
    if (!mainElement || !footerElement) {
      throw new Error("expected both a main and a footer element to render");
    }
    expect(mainElement.contains(footerElement)).toBe(false);
  });

  it("renders its own status bar with a window for every landing section", () => {
    renderLandingPageInsideKeybindProvider();
    expect(
      screen.getByRole("contentinfo", { name: "Status bar" }),
    ).toBeTruthy();
    const windowLabels = screen
      .getAllByRole("button")
      .map((element) => element.textContent);
    for (const [index, section] of LANDING_SECTIONS.entries()) {
      expect(windowLabels).toContain(`${index + 1}:${section.label}`);
    }
  });

  it("keeps the keyboard section reachable by its DOM id", () => {
    const { container } = renderLandingPageInsideKeybindProvider();
    expect(requireElementById(container, KEYBOARD_SECTION_ID)).toBeTruthy();
  });
});
