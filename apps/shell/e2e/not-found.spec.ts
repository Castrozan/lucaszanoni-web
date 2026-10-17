import { expect, test } from "@playwright/test";

test("recovers a direct missing-page visit with the keyboard", async ({
  page,
}) => {
  await page.goto("/lost/somewhere/else");
  await expect(page).toHaveTitle("Page not found · Lucas Zanoni");
  await expect(
    page.getByRole("heading", { name: /a dead end/i }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /take me home/i })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(page.getByText("ONE EDGE.", { exact: true })).toBeVisible();
  await expect(page).toHaveTitle("Lucas Zanoni");
});

test("offers the catalog without relying on browser history", async ({
  page,
}) => {
  await page.goto("/not-a-page");
  await page.getByRole("link", { name: /explore the catalog/i }).click();
  await expect(page).toHaveURL("/catalog");
  await expect(page.getByRole("heading", { name: "CATALOG" })).toBeVisible();
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 375, height: 812 },
  { width: 568, height: 320 },
  { width: 768, height: 900 },
  { width: 844, height: 390 },
  { width: 1440, height: 720 },
  { width: 1440, height: 900 },
]) {
  test(`fits the viewport without scrolling at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/off-the-map");
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole("link", { name: /take me home/i }),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByRole("link", { name: /explore the catalog/i }),
    ).toBeInViewport({ ratio: 1 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= window.innerHeight,
      ),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 1000));
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.locator(".not-found-scene").evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      );
    });
    await page.screenshot({
      path: test
        .info()
        .outputPath(`not-found-${viewport.width}x${viewport.height}.png`),
      fullPage: true,
    });
  });
}

test("stops decorative animation when reduced motion is requested", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/wrong-turn");
  const traveler = page.locator(".not-found-traveler");
  expect(
    await traveler.evaluate(
      (element) => getComputedStyle(element).animationName,
    ),
  ).toBe("not-found-detour");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(traveler).toHaveCSS("animation-name", "none");
  await expect(page.locator(".not-found-question")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect
    .poll(() =>
      page
        .locator(".not-found-scene")
        .evaluate((element) => element.getAnimations({ subtree: true }).length),
    )
    .toBe(0);
  await expect(page.getByRole("link", { name: /take me home/i })).toBeVisible();
  await page.reload();
  expect(
    await traveler.evaluate(
      (element) => getComputedStyle(element).animationName,
    ),
  ).toBe("none");
});

test("renders the same page with the design system light palette", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/e2e/fixtures/not-found-light.html");
  await expect(
    page.getByRole("heading", { name: /a dead end/i }),
  ).toBeVisible();
  expect(
    await page
      .locator(".not-found-heading span")
      .evaluate((element) => getComputedStyle(element).color),
  ).toBe("rgb(9, 105, 218)");
  expect(
    await page
      .locator('[data-theme="light"]')
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe("rgb(255, 255, 255)");
  await expect(page.getByRole("link", { name: /take me home/i })).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("not-found-light.png"),
  });
});
