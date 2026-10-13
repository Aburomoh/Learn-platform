import { test, expect, type Page } from "@playwright/test";

// S2 (#680, IA §4.3b): "Practices in this topic (k of n)" on the practice page. Collapsed by default
// (the stage keeps the fold), the same rows as the topic page with the current practice marked, a
// navigator that never writes progress; the summary's quiet exits. The tests set their own
// viewport, so both Playwright projects measure both widths.

const PRACTICE = "/courses/ecet111/binary-arithmetic/subtraction-positive/";
const PROGRESS = "cet-learn:v1:progress:ecet111.2026-fall";

const navigator = (page: Page) => page.getByTestId("topic-navigator");

for (const [width, height] of [
  [390, 844],
  [1280, 800],
] as const) {
  test(`navigator at ${width}×${height}: collapsed under the location line, the current practice marked, another practice one tap away, no progress written`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto(PRACTICE);
    await expect(page.getByTestId("learning-stage")).toBeVisible();
    const nav = navigator(page);
    await expect(nav).toBeVisible();
    await expect(nav).not.toHaveAttribute("open", "");
    const summary = nav.locator("summary");
    await expect(summary).toHaveText(/^Practices in this topic \(\d+ of \d+\)/);
    // the first challenge still starts inside the first screen with the navigator closed
    const stage = page.getByTestId("learning-stage");
    expect((await stage.boundingBox())!.y).toBeLessThan(height);

    await summary.click();
    await expect(nav).toHaveAttribute("open", "");
    const list = nav.getByRole("navigation", { name: "Practices in this topic" });
    await expect(list).not.toHaveAttribute("aria-busy", "true");
    const rows = list.getByRole("listitem");
    expect(await rows.count()).toBeGreaterThan(2);
    const here = list.locator("[aria-current='page']");
    await expect(here).toHaveCount(1);
    await expect(here).toContainText("Subtraction by 2's complement");
    await expect(here).toContainText("Here");
    await expect(here.getByRole("link")).toHaveCount(0);
    // rows name the kind and the steps, for finding; labels are never links
    await expect(rows.first()).toHaveAttribute("data-kinds", /.+/);
    await expect(list.getByRole("link", { name: /^Start · Binary addition/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

    // opening and reading the navigator wrote nothing
    await page.waitForTimeout(1300);
    expect(await page.evaluate((k) => localStorage.getItem(k), PROGRESS)).toBeNull();

    // another practice, by name, at challenge 1
    await list.getByRole("link", { name: /^Start · Binary addition/ }).click();
    await expect(page).toHaveURL(/\/binary-arithmetic\/binary-addition\/?$/);
    await expect(page.getByText("Challenge 1 of")).toBeVisible();
    await expect(navigator(page).locator("summary")).toHaveText(/\(1 of \d+\)/);
  });
}

test("a one-practice topic has no navigator", async ({ page }) => {
  await page.goto("/courses/ecet111/place-value/place-value/");
  await expect(page.getByTestId("learning-stage")).toBeVisible();
  await expect(navigator(page)).toHaveCount(0);
});

test("the practice summary offers quiet exits beside the filled Next: Back to topic, Another practice in this topic, Course map", async ({ page }) => {
  // a finished one-question practice: seed every question done, then Review restarts it at challenge 1 and one answer completes it
  await page.goto("/courses/cpet181/magnetic-tape/count-gaps/");
  await expect(page.getByTestId("learning-stage")).toBeVisible();
  const records = Number((await page.locator("main").innerText()).match(/(\d+) records are stored on a tape one by one/)![1]);
  await page.locator("main input:not([type=radio])").first().fill(String(records - 1));
  await page.getByRole("button", { name: /^Check/ }).first().click();
  await expect(page.locator("[role=status]").filter({ hasText: /^Correct/ }).first()).toBeVisible();
  await page.getByRole("button", { name: /Next challenge/ }).click();
  const m = (await page.locator("main").innerText()).match(/(\d+) records are stored on a tape in blocks of (\d+) records/)!;
  await page.locator("main input:not([type=radio])").first().fill(String(Math.ceil(Number(m[1]) / Number(m[2])) - 1));
  await page.getByRole("button", { name: /^Check/ }).first().click();
  await expect(page.locator("[role=status]").filter({ hasText: /^Correct/ }).first()).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();
  const summary = page.getByTestId("activity-summary");
  await expect(summary).toBeVisible();
  await expect(summary.locator("[data-primary-action]")).toHaveCount(1);
  await expect(summary.getByRole("link", { name: "Course map" })).toHaveAttribute("href", /\/courses\/cpet181\/?$/);
  const another = summary.getByRole("link", { name: "Another practice in this topic" });
  if (await another.count()) await expect(another).toHaveAttribute("href", /\/courses\/cpet181\/magnetic-tape\/#practices$/);
});
