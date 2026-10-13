import { test, expect, type Page } from "@playwright/test";

// Navigation journeys (epic #670). Progress lives in localStorage; a returning student is seeded
// before the page loads. The tests set their own viewport, so both Playwright projects measure
// both widths.

const PROGRESS_KEY = "cet-learn:v1:progress:ecet111.2026-fall";

/** ECET111, challenge 3 of decimal-to-binary in progress: the "Continue" case. */
async function seedReturning(page: Page) {
  await page.addInitScript(
    ([key, record]) => localStorage.setItem(key, record),
    [
      PROGRESS_KEY,
      JSON.stringify({
        version: 1,
        offeringId: "ecet111.2026-fall",
        activities: { "decimal-to-binary": { status: "started", attempts: 3, hintsUsed: 0, independent: true, lastAt: Date.now(), completedQuestions: ["ns.q.divide", "ns.q.read"] } },
        concepts: {},
      }),
    ] as const,
  );
}

async function openHome(page: Page) {
  await page.goto("/");
  await expect(page.locator("[data-home]")).not.toHaveAttribute("aria-busy", "true");
}

for (const [width, height] of [
  [390, 844],
  [1280, 800],
] as const) {
  test(`Home at ${width}×${height}: the first course row is inside the first screen, first visit and returning (#675, QW10)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openHome(page);
    await expect(page.locator("[data-home]")).toHaveAttribute("data-home", "first");
    const row = page.locator("#courses li").first();
    expect((await row.boundingBox())!.y).toBeLessThan(height);
    // no challenge dots in the hero, at any time
    await expect(page.getByRole("list", { name: "Challenges" })).toHaveCount(0);

    await seedReturning(page);
    await openHome(page);
    await expect(page.locator("[data-home]")).toHaveAttribute("data-home", "returning");
    expect((await row.boundingBox())!.y).toBeLessThan(height);
    await expect(page.getByRole("list", { name: "Challenges" })).toHaveCount(0);
    await expect(page.getByText(/Challenge 3 of \d+ · about \d+ min left/)).toBeVisible();
  });
}

test("Home course rows: each course has its own Start / Continue naming its practice, plus Open course; the catalogue is #courses (#675, QW9)", async ({ page }) => {
  await openHome(page);
  const rows = page.locator("#courses li");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0).getByRole("link", { name: /^Start · Place value and base → decimal/ })).toHaveAttribute("href", /\/courses\/ecet111\/place-value\/place-value\/?$/);
  await expect(rows.nth(1).getByRole("link", { name: /^Start · / })).toHaveAttribute("href", /\/courses\/cpet181\//);
  await expect(rows.nth(0).getByRole("link", { name: /^Open course/ })).toHaveAttribute("href", /\/courses\/ecet111\/?$/);

  // returning: the course in progress says Continue · its practice; the other still says Start
  await seedReturning(page);
  await openHome(page);
  await expect(rows.nth(0)).toHaveAttribute("data-action", "continue");
  await expect(rows.nth(0).getByRole("link", { name: /^Continue · Decimal → binary → octal → hexadecimal/ })).toHaveAttribute("href", /\/courses\/ecet111\/number-systems\/decimal-to-binary\/?$/);
  await expect(rows.nth(1)).toHaveAttribute("data-action", "start");

  // the catalogue anchor lands on the list
  await page.goto("/#courses");
  await expect(page.locator("#courses")).toBeInViewport();
});
