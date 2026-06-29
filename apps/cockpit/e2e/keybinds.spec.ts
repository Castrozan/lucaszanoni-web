import { expect, test, type Page } from "@playwright/test";

const cockpitDashboardPath = "/cockpit/dashboard";
const cockpitJarvisPath = "/cockpit/jarvis";

const commandPalette = (page: Page) =>
  page.getByRole("dialog", { name: "Command palette" });
const selectedCommandOption = (page: Page) =>
  page.getByRole("option", { selected: true });

async function gotoCockpit(page: Page, path: string) {
  await page.goto(path);
  await expect(
    page.getByRole("contentinfo", { name: "Status bar" }),
  ).toBeVisible();
}

async function pressCockpitLeaderChord(page: Page) {
  await page.keyboard.press("Control+b");
}

async function openCommandPaletteWithLeader(page: Page) {
  await pressCockpitLeaderChord(page);
  await page.keyboard.press("k");
  await expect(commandPalette(page)).toBeVisible();
}

test.describe("cockpit leader-key bindings", () => {
  test.beforeEach(async ({ page }) => {
    await gotoCockpit(page, cockpitDashboardPath);
  });

  test("leader then a navigates to the jarvis view", async ({ page }) => {
    await pressCockpitLeaderChord(page);
    await page.keyboard.press("a");
    await expect(page).toHaveURL(/\/cockpit\/jarvis$/);
  });

  test("leader then k opens the command palette", async ({ page }) => {
    await pressCockpitLeaderChord(page);
    await page.keyboard.press("k");
    await expect(commandPalette(page)).toBeVisible();
  });

  test("escape while armed cancels the pending leader chord", async ({
    page,
  }) => {
    await pressCockpitLeaderChord(page);
    await page.keyboard.press("Escape");
    await page.keyboard.press("a");
    await expect(page).toHaveURL(/\/cockpit\/dashboard$/);
  });

  test("the armed chord disarms after the arm timeout elapses", async ({
    page,
  }) => {
    await pressCockpitLeaderChord(page);
    await page.waitForTimeout(1700);
    await page.keyboard.press("a");
    await expect(page).toHaveURL(/\/cockpit\/dashboard$/);
  });

  test("the leader chord is suppressed while an editable element is focused", async ({
    page,
  }) => {
    await gotoCockpit(page, cockpitJarvisPath);
    await page.getByRole("tab", { name: "Conversation" }).click();
    await page.getByRole("textbox", { name: "Message Jarvis" }).click();
    await pressCockpitLeaderChord(page);
    await page.keyboard.press("k");
    await expect(commandPalette(page)).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "Message Jarvis" }),
    ).toHaveValue("k");
  });
});

test.describe("status-bar leader navigation across cockpit and the terminal", () => {
  test("bare cockpit: the leader then a window number jumps windows", async ({
    page,
  }) => {
    await gotoCockpit(page, cockpitDashboardPath);
    await pressCockpitLeaderChord(page);
    await page.keyboard.press("4");
    await expect(page).toHaveURL(/\/cockpit\/user$/);
  });

  test("jarvis: the leader escapes the focused terminal to jump windows", async ({
    page,
  }) => {
    await gotoCockpit(page, cockpitJarvisPath);
    await expect(page.locator(".xterm")).toBeVisible();
    await page.locator("textarea.xterm-helper-textarea").focus();
    await pressCockpitLeaderChord(page);
    await page.keyboard.press("4");
    await expect(page).toHaveURL(/\/cockpit\/user$/);
  });
});

test.describe("command palette keyboard control", () => {
  test.beforeEach(async ({ page }) => {
    await gotoCockpit(page, cockpitDashboardPath);
    await openCommandPaletteWithLeader(page);
  });

  test("typing a query fuzzy-filters the command list", async ({ page }) => {
    await page.getByRole("textbox", { name: "Search commands" }).fill("User");
    await expect(
      page.getByRole("option", { name: /Go to User/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: /Go to Dashboard/ }),
    ).toHaveCount(0);
  });

  test("arrow keys move the command selection and reverse it", async ({
    page,
  }) => {
    await expect(selectedCommandOption(page)).toHaveAccessibleName(
      /Go to Workspace/,
    );
    await page.keyboard.press("ArrowDown");
    await expect(selectedCommandOption(page)).toHaveAccessibleName(
      /Go to Dashboard/,
    );
    await page.keyboard.press("ArrowUp");
    await expect(selectedCommandOption(page)).toHaveAccessibleName(
      /Go to Workspace/,
    );
  });

  test("enter runs the selected command then closes the palette", async ({
    page,
  }) => {
    await page.getByRole("textbox", { name: "Search commands" }).fill("User");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/cockpit\/user$/);
    await expect(commandPalette(page)).toHaveCount(0);
  });

  test("escape closes the palette without running a command", async ({
    page,
  }) => {
    await page.keyboard.press("Escape");
    await expect(commandPalette(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/cockpit\/dashboard$/);
  });
});
