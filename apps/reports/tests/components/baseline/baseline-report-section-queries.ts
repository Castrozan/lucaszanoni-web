import { screen } from "@testing-library/react";

export function headingTexts(): string[] {
  return screen
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent ?? "");
}

export function sectionTitled(
  container: HTMLElement,
  title: string,
): HTMLElement {
  const section = Array.from(container.querySelectorAll("section")).find(
    (candidate) => candidate.querySelector("h2")?.textContent === title,
  );
  if (!section) {
    throw new Error(`no section titled ${title}`);
  }
  return section;
}
