import { test, expect, type Page } from "@playwright/test";

// Input made before hydration is kept (#708). The page's scripts are held back and the CPU is
// throttled, so the student acts on the pre-rendered controls before React attaches; once it
// has, the tap or the digits are still there and Check is on. The tests set their own viewport,
// so both Playwright projects measure both widths.

const DIVISION = "/courses/ecet111/number-systems/decimal-to-binary/";
const CHOICE = "/courses/cpet181/record-organization/organizations/";

const hydrated = (page: Page) =>
  page.waitForFunction(() => {
    const el = document.querySelector("[data-testid=learning-stage]");
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber"));
  });

/** Holds every script of the page back for `ms`, so the pre-rendered controls are alone for that long. */
async function slowScripts(page: Page, ms: number) {
  await page.route("**/_next/static/**/*.js", async (route) => {
    await new Promise((r) => setTimeout(r, ms));
    await route.continue();
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
}

const notHydrated = (page: Page) => page.evaluate(() => !Object.keys(document.querySelector("[data-testid=learning-stage]")!).some((k) => k.startsWith("__reactFiber")));

for (const [width, height] of [
  [390, 844],
  [1280, 800],
] as const) {
  test(`digits typed before hydration at ${width}×${height} are kept: Check step turns on and the step is graded`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await slowScripts(page, 2500);
    await page.goto(DIVISION, { waitUntil: "commit" });
    const result = page.getByLabel("26 divided by 2: result");
    const remainder = page.getByLabel("26 divided by 2: remainder");
    await result.fill("13");
    await remainder.fill("0");
    expect(await notHydrated(page), "typed before hydration").toBe(true);
    await expect(page.getByRole("button", { name: "Check step" })).toBeDisabled();

    await hydrated(page);
    await expect(result).toHaveValue("13");
    await expect(remainder).toHaveValue("0");
    await expect(page.getByRole("button", { name: "Check step" })).toBeEnabled();
    await page.getByRole("button", { name: "Check step" }).click();
    await expect(page.getByLabel("13 divided by 2: result")).toBeVisible();
  });

  test(`an option tapped before hydration at ${width}×${height} stays selected and Check turns on`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await slowScripts(page, 2500);
    await page.goto(CHOICE, { waitUntil: "commit" });
    const radios = page.getByRole("radio");
    await radios.nth(1).check({ force: true });
    expect(await notHydrated(page), "tapped before hydration").toBe(true);
    await expect(radios.nth(1)).toBeChecked();

    await hydrated(page);
    await expect(radios.nth(1)).toBeChecked();
    await expect(page.getByRole("button", { name: /^Check/ })).toBeEnabled();
    await page.getByRole("button", { name: /^Check/ }).click();
    await expect(page.locator("[role=status]").filter({ hasText: /Correct|Not (quite|correct)/ }).first()).toBeVisible();
  });
}

test("a practice opened and left alone: nothing replayed, no page error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(DIVISION);
  await hydrated(page);
  await page.waitForTimeout(300);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => "__cetPreInput" in window)).toBe(false);
  await expect(page.getByRole("button", { name: "Check step" })).toBeDisabled();
});
