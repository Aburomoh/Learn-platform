import { test, expect, type Page } from "@playwright/test";

// Meaningful progress (ADR-0013, epic #670 S1, #677): journeys E and F of docs/navigation/IA_AUDIT_670.md.
// A look at a practice is not study: only an attempt or a finished challenge makes it Continue or
// switches the active course. The tests set their own viewport, so both Playwright projects measure both widths.

const ECET = "ecet111.2026-fall";
const CPET = "cpet181.2026-fall";
const key = (offering: string) => `cet-learn:v1:progress:${offering}`;
const ECET_PRACTICE = "/courses/ecet111/number-systems/decimal-to-binary/";
const CPET_PRACTICE = "/courses/cpet181/magnetic-tape/count-gaps/";

/** The stored record of one practice, after the store's debounced write. */
async function storedRecord(page: Page, offering: string, activityId: string) {
  await page.waitForTimeout(1300);
  return page.evaluate(
    ([k, id]) => {
      const raw = localStorage.getItem(k);
      return raw ? ((JSON.parse(raw).activities ?? {})[id] ?? null) : null;
    },
    [key(offering), activityId] as const,
  );
}

/** ECET111, challenge 3 of decimal-to-binary in progress: a student of that course. */
async function seedEcet(page: Page) {
  await page.addInitScript(
    ([k, record]) => {
      if (!localStorage.getItem(k)) localStorage.setItem(k, record);
    },
    [
      key(ECET),
      JSON.stringify({
        version: 1,
        offeringId: ECET,
        activities: { "decimal-to-binary": { status: "started", attempts: 3, hintsUsed: 0, independent: true, lastAt: Date.now() - 60_000, completedQuestions: ["ns.q.divide", "ns.q.read"] } },
        concepts: {},
      }),
    ] as const,
  );
}

async function openHome(page: Page) {
  await page.goto("/");
  await expect(page.locator("[data-home]")).not.toHaveAttribute("aria-busy", "true");
}

const hero = (page: Page) => page.locator("[data-home] section").first();
const row = (page: Page, course: string) => page.locator(`#courses li[data-course='${course}']`);

for (const [width, height] of [
  [390, 844],
  [1280, 800],
] as const) {
  test(`Journey E at ${width}×${height}: a direct URL, a look and leaving changes nothing on Home; one checked answer makes it Continue`, async ({ page }) => {
    await page.setViewportSize({ width, height });

    // a look: the practice opens, nothing is written
    await page.goto(ECET_PRACTICE);
    await expect(page.getByTestId("learning-stage")).toBeVisible();
    await expect(page.getByLabel("26 divided by 2: result")).toBeVisible();
    expect(await storedRecord(page, ECET, "decimal-to-binary")).toBeNull();

    // an explained-only record (Explain Slowly opened, nothing tried; owner refinement 3) is not progress either.
    // Seeded: before #691 the control only appears after an attempt, and an attempt is progress.
    await page.evaluate(
      ([k, record]) => localStorage.setItem(k, record),
      [key(ECET), JSON.stringify({ version: 1, offeringId: ECET, activities: { "decimal-to-binary": { status: "started", attempts: 0, hintsUsed: 0, independent: false, lastAt: Date.now(), explained: true } }, concepts: {} })] as const,
    );

    // Home: still a first visit; the course row still says Start
    await openHome(page);
    await expect(page.locator("[data-home]")).toHaveAttribute("data-home", "first");
    await expect(page.getByRole("heading", { level: 1, name: "Start here" })).toBeVisible();
    await expect(row(page, "ecet111")).toHaveAttribute("data-action", "start");
    await expect(row(page, "ecet111")).not.toContainText("started");
    await expect(row(page, "ecet111").getByRole("link", { name: /^Start · / })).toBeVisible();

    // one checked answer (even a wrong one) is meaningful progress
    await page.goto(ECET_PRACTICE);
    await expect(page.getByLabel("26 divided by 2: result")).toBeVisible();
    await page.getByLabel("26 divided by 2: result").fill("12");
    await page.getByLabel("26 divided by 2: remainder").fill("0");
    await page.getByRole("button", { name: "Check step" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Not correct yet." })).toBeVisible();
    expect(await storedRecord(page, ECET, "decimal-to-binary")).toMatchObject({ status: "started", attempts: 1 });

    await openHome(page);
    await expect(page.locator("[data-home]")).toHaveAttribute("data-home", "returning");
    await expect(page.getByRole("heading", { level: 1, name: "Pick up where you left off" })).toBeVisible();
    await expect(hero(page)).toContainText("ECET 111");
    await expect(page.locator("[data-primary-action]")).toHaveText(/^Continue · Decimal/);
    await expect(row(page, "ecet111")).toHaveAttribute("data-action", "continue");
    await expect(row(page, "ecet111")).toContainText("1 started");
  });

  test(`Journey F at ${width}×${height}: browsing another course never switches the greeting; answering there does`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await seedEcet(page);
    await openHome(page);
    await expect(page.locator("[data-home]")).toHaveAttribute("data-home", "returning");
    await expect(hero(page)).toContainText("ECET 111");

    // browse a CPET 181 practice: open it, read it, leave
    await page.goto(CPET_PRACTICE);
    await expect(page.getByTestId("learning-stage")).toBeVisible();
    expect(await storedRecord(page, CPET, "count-gaps")).toBeNull();
    await openHome(page);
    await expect(hero(page)).toContainText("ECET 111");
    await expect(page.locator("[data-primary-action]")).toHaveText(/^Continue · Decimal/);
    await expect(row(page, "cpet181")).toHaveAttribute("data-action", "start");
    await expect(row(page, "ecet111")).toHaveAttribute("data-action", "continue");

    // answer there: the active course switches to CPET 181; ECET 111 keeps its own Continue on its row
    await page.goto(CPET_PRACTICE);
    await expect(page.getByTestId("learning-stage")).toBeVisible();
    const records = Number((await page.locator("main").innerText()).match(/(\d+) records are stored on a tape one by one/)![1]);
    await page.locator("main input:not([type=radio])").first().fill(String(records - 1));
    await page.getByRole("button", { name: /^Check/ }).first().click();
    await expect(page.locator("[role=status]").filter({ hasText: /^Correct/ }).first()).toBeVisible();
    expect(await storedRecord(page, CPET, "count-gaps")).toMatchObject({ status: "started", attempts: 1 });

    await openHome(page);
    await expect(hero(page)).toContainText("CPET 181");
    await expect(page.locator("[data-primary-action]")).toHaveText(/^Continue · /);
    await expect(row(page, "cpet181")).toHaveAttribute("data-action", "continue");
    await expect(row(page, "ecet111")).toHaveAttribute("data-action", "continue");
    await expect(row(page, "ecet111").getByRole("link", { name: /^Continue · Decimal/ })).toBeVisible();
  });
}
