import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LandingPage } from "../src/landing/LandingPage";
import {
  ABOUT_SECTION_ID,
  COCKPIT_SECTION_ID,
  HERO_SECTION_ID,
  SHOWCASE_SECTION_ID,
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

describe("LandingPage", () => {
  it("orders the sections Hero, then Cockpit, then Showcase, then About", () => {
    const { container } = renderLandingPage();
    const heroElement = requireElementById(container, HERO_SECTION_ID);
    const cockpitElement = requireElementById(container, COCKPIT_SECTION_ID);
    const showcaseElement = requireElementById(container, SHOWCASE_SECTION_ID);
    const aboutElement = requireElementById(container, ABOUT_SECTION_ID);

    expect(
      heroElement.compareDocumentPosition(cockpitElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      cockpitElement.compareDocumentPosition(showcaseElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      showcaseElement.compareDocumentPosition(aboutElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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
});
