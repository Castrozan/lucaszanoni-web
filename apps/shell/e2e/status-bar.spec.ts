import { expect, test, type Page } from "@playwright/test";

const statusBar = (page: Page) =>
  page.getByRole("contentinfo", { name: "Status bar" });

test.describe("status bar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(statusBar(page)).toBeVisible();
  });

  test("is pinned to the bottom of the viewport", async ({ page }) => {
    const box = await statusBar(page).boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(Math.abs(box!.y + box!.height - viewport!.height)).toBeLessThan(2);
  });

  test("shows the active session and its current window", async ({ page }) => {
    const bar = statusBar(page);
    await expect(bar.getByText("Atrium", { exact: true })).toBeVisible();
    const heroWindow = bar.getByRole("button", { name: "1:Hero" });
    await expect(heroWindow).toBeVisible();
    await expect(heroWindow).toHaveAttribute("aria-current", "page");
  });

  test("reserves bottom space so page content is not occluded", async ({
    page,
  }) => {
    const reserved = await page.evaluate(() => {
      const rootVar = getComputedStyle(document.documentElement)
        .getPropertyValue("--app-status-bar-height")
        .trim();
      const spacer = document.querySelector(
        'div[style*="app-status-bar-height"]',
      );
      return {
        rootVar,
        spacerPadding: spacer ? getComputedStyle(spacer).paddingBottom : null,
      };
    });
    expect(reserved.rootVar).toBe("2rem");
    expect(reserved.spacerPadding).toBe("32px");
  });
});
