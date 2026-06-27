import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { ArtifactIframePage } from "../../src/components/artifact/ArtifactIframePage";

const artifactUrl =
  "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/reports/baseline/index.html";

function renderArtifactPage() {
  return render(
    <ArtifactIframePage
      heading="agent-eval baseline"
      description="pass-rate trend"
      artifactUrl={artifactUrl}
      iframeTitle="agent-eval baseline dashboard"
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ArtifactIframePage", () => {
  describe("when the bucket has the artifact published", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true, status: 200 }),
      );
    });

    it("renders the iframe pointed at the artifact url", async () => {
      const { container } = renderArtifactPage();
      await waitFor(() => {
        expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
          artifactUrl,
        );
      });
    });

    it("does not show the unpublished fallback", async () => {
      renderArtifactPage();
      await waitFor(() => {
        expect(screen.getByTitle("agent-eval baseline dashboard")).toBeTruthy();
      });
      expect(
        screen.queryByText(/This artifact is not published yet/),
      ).toBeNull();
    });
  });

  describe("when the artifact is missing from the bucket", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 404 }),
      );
    });

    it("renders the friendly fallback instead of the iframe", async () => {
      const { container } = renderArtifactPage();
      expect(
        await screen.findByText(/This artifact is not published yet/),
      ).toBeTruthy();
      expect(container.querySelector("iframe")).toBeNull();
    });
  });

  describe("when the bucket request fails outright", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("network down")),
      );
    });

    it("renders the friendly fallback", async () => {
      renderArtifactPage();
      expect(
        await screen.findByText(/This artifact is not published yet/),
      ).toBeTruthy();
    });
  });
});
