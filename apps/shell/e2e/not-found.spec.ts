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

for (const width of [375, 768, 1440]) {
  test(`keeps recovery visible without horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/off-the-map");
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole("link", { name: /take me home/i }),
    ).toBeInViewport();
    await expect(
      page.getByRole("link", { name: /explore the catalog/i }),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.locator(".not-found-scene").evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished),
      );
    });
    await page.screenshot({
      path: test.info().outputPath(`not-found-${width}.png`),
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
