import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MICRO_FRONTEND_ROUTES } from "@platform/config";
import { featurePreviews } from "../src/landing/landingContent";
import { FeaturePreview } from "../src/landing/FeaturePreview";

afterEach(cleanup);

describe("FeaturePreview", () => {
  it("links every public ai app to its live mount path", () => {
    render(<FeaturePreview />);
    const publicAiRoutes = MICRO_FRONTEND_ROUTES.filter(
      (route) =>
        route.accessModel.environment === "public" && route.isAiPowered,
    );
    expect(publicAiRoutes.length).toBeGreaterThan(0);
    const tryItHrefs = screen
      .getAllByRole("link", { name: /try it live/i })
      .map((element) => element.getAttribute("href"));
    for (const route of publicAiRoutes) {
      expect(tryItHrefs).toContain(route.mountPath);
    }
  });

  it("reveals the canned samples without any network call", () => {
    render(<FeaturePreview />);
    for (const preview of featurePreviews) {
      const firstLine = preview.sampleLines[0];
      if (firstLine) {
        expect(screen.queryByText(firstLine)).toBeNull();
      }
    }
    for (const button of screen.getAllByRole("button", {
      name: /reveal sample/i,
    })) {
      fireEvent.click(button);
    }
    for (const preview of featurePreviews) {
      const firstLine = preview.sampleLines[0];
      if (firstLine) {
        expect(screen.getByText(firstLine)).toBeTruthy();
      }
    }
  });
});
