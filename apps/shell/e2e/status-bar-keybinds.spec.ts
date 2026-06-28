import { expect, test, type Page } from "@playwright/test";

const commandPalette = (page: Page) =>
  page.getByRole("dialog", { name: "Command palette" });

test.describe("status bar keybinds", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("contentinfo", { name: "Status bar" }),
    ).toBeVisible();
  });

  test("leader s opens the command palette as the session picker", async ({
    page,
  }) => {
    await page.keyboard.press("Control+b");
    await page.keyboard.press("s");
    await expect(commandPalette(page)).toBeVisible();
  });

  test("leader p no longer opens the command palette", async ({ page }) => {
    await page.keyboard.press("Control+b");
    await page.keyboard.press("p");
    await expect(commandPalette(page)).toHaveCount(0);
  });
});
