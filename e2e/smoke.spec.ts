import { test, expect, type Page } from "@playwright/test";

/**
 * Core student flow (docs/MILESTONES.md):
 * open → choose course → open activity → one division step at a time → wrong step → feedback →
 * hint → Explain Slowly → retry → finish the chain → read the bits → progress survives reload.
 * Runs at desktop and mobile viewports.
 */

const TOPIC = "/courses/ecet111/number-systems/";
const ACTIVITY = `${TOPIC}decimal-to-binary/`;

async function divisionStep(page: Page, dividend: number, quotient: number, remainder: number) {
  await page.getByLabel(`${dividend} divided by 2: result`).fill(String(quotient));
  await page.getByLabel(`${dividend} divided by 2: remainder`).fill(String(remainder));
  await page.getByRole("button", { name: "Check step" }).click();
}

test("home lists the course and navigates to an activity", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("DEMO / NOT AUTHORITATIVE COURSE CONTENT")).toBeVisible();
  // each hop waits for its URL so a slow transition fails at the hop, not on a stale page
  await page.getByRole("link", { name: /Introduction to Digital System Design/ }).click();
  await expect(page).toHaveURL(/\/courses\/ecet111\/$/);
  await page.getByRole("link", { name: /Number-base conversions/ }).click();
  await expect(page).toHaveURL(new RegExp(`${TOPIC}$`));
  await page.getByRole("link", { name: /Decimal → binary/ }).click();
  await expect(page).toHaveURL(new RegExp(`${ACTIVITY}$`));
  await expect(page.getByTestId("learning-stage")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("guest flow: walked division with feedback, hints, Explain Slowly, retry, read-off, saved progress", async ({ page }) => {
  const requests: string[] = [];
  await page.goto(ACTIVITY);
  const stage = page.getByTestId("learning-stage");
  await expect(stage).toBeVisible();
  page.on("request", (r) => requests.push(r.url()));

  // the chain length is not given away: only the first number is visible
  await expect(page.getByLabel("26 divided by 2: result")).toBeVisible();
  await expect(page.getByLabel("13 divided by 2: result")).toHaveCount(0);

  // 1. a correct step opens the next one and the tutor names it
  await divisionStep(page, 26, 13, 0);
  await expect(page.getByLabel("13 divided by 2: result")).toBeVisible();
  await expect(page.locator("[data-expression='encouraging']:visible")).toBeVisible();

  // 2. a wrong step: short feedback, no advance, tutor thinks
  await divisionStep(page, 13, 6, 0);
  await expect(page.getByRole("status").filter({ hasText: "Not correct yet." })).toBeVisible();
  await expect(stage).toHaveAttribute("data-stage", "await_retry");
  await expect(page.locator("[data-expression='thinking']:visible")).toBeVisible();
  await expect(page.getByLabel("13 divided by 2: result")).toBeVisible();

  // 3. hint ladder about this step
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(page.getByText("Nudge")).toBeVisible();
  await page.getByRole("button", { name: "Another hint" }).click();
  await expect(page.getByText("Concept")).toBeVisible();

  // 4. Explain Slowly with a prediction before the reveal
  await page.getByRole("button", { name: "Explain slowly" }).click();
  await expect(page.getByText("Step 1 of 7")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("[data-prediction]").getByText("What is the remainder of 26 ÷ 2?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  await page.locator("[data-prediction]").getByRole("button", { name: "0", exact: true }).click();
  await expect(page.locator("[data-prediction]").getByRole("status")).toContainText("26 ÷ 2 = 13");
  for (let i = 0; i < 10 && (await stage.getAttribute("data-stage")) === "explaining"; i++) {
    const pending = page.locator("[data-prediction] button:not([disabled])");
    if ((await pending.count()) > 0) await pending.first().click();
    await page.getByRole("button", { name: /Continue|Now I try/ }).click();
  }

  // 5. independent retry from the first step, all the way to 0
  await expect(stage).toHaveAttribute("data-stage", "await_retry");
  await divisionStep(page, 26, 13, 0);
  await divisionStep(page, 13, 6, 1);
  await divisionStep(page, 6, 3, 0);
  await divisionStep(page, 3, 1, 1);
  await divisionStep(page, 1, 0, 1);
  await expect(page.getByRole("status").filter({ hasText: "Correct." })).toBeVisible();
  await expect(page.locator("[data-expression='pleased']:visible")).toBeVisible();

  // 6. read the remainders: LSB-first is recognised, MSB-first is right
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByText("Question 2 of 4")).toBeVisible();
  await page.getByRole("textbox").fill("01011");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Not correct yet." })).toBeVisible();
  await page.getByRole("textbox").fill("11010");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Correct." })).toBeVisible();

  // 7. only same-origin static assets were requested (no server or third-party calls)
  const origin = new URL(page.url()).origin;
  const nonStatic = requests.filter((u) => !u.startsWith("data:") && !(u.startsWith(origin) && /\/_next\/|\/__next\./.test(u)));
  expect(nonStatic).toEqual([]);

  // 8. progress persisted locally and visible after navigation
  await page.waitForTimeout(1200); // debounced write
  const stored = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("cet-learn:v1:progress:")));
  expect(stored).toHaveLength(1);
  await page.goto(TOPIC);
  await expect(page.getByTestId("status-decimal-to-binary")).toHaveText("Started");
});

test("octal and hex by grouping finish the activity", async ({ page }) => {
  await page.goto(ACTIVITY);
  for (const [d, q, r] of [[26, 13, 0], [13, 6, 1], [6, 3, 0], [3, 1, 1], [1, 0, 1]]) await divisionStep(page, d, q, r);
  for (const answer of ["11010", "32", "1A"]) {
    await page.getByRole("button", { name: "Next question" }).click();
    await page.getByRole("textbox").fill(answer);
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Correct." })).toBeVisible();
  }
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByTestId("activity-summary")).toContainText("no hints needed");
});

test("logic gates activity: predict output, then explore inputs after completion", async ({ page }) => {
  await page.goto("/courses/ecet111/logic-gates/predict-gate-output/");
  await expect(page.getByRole("img", { name: /Circuit with NOT, AND, OR/ })).toBeVisible();
  await page.getByLabel(/Y = 0/).check();
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Not correct yet." })).toBeVisible();
  await page.getByLabel(/Y = 1/).check();
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Correct." })).toBeVisible();
  await expect(page.locator("svg text", { hasText: "Y = 1" })).toBeVisible();
  await page.getByRole("switch", { name: /Input C/ }).click();
  await page.getByRole("switch", { name: /Input A/ }).click();
  await expect(page.locator("svg text", { hasText: "Y = 0" })).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByText("Question 2 of 2")).toBeVisible();
});

test("settings: clear local data resets progress", async ({ page }) => {
  await page.goto(ACTIVITY);
  await expect(page.getByTestId("learning-stage")).toBeVisible();
  await page.waitForTimeout(1200);
  await page.goto("/settings/");
  await page.getByRole("button", { name: "Clear my local data" }).click();
  await expect(page.getByRole("status")).toHaveText(/Cleared/);
  const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("cet-learn:v1:progress:")));
  expect(keys).toEqual([]);
});

test("reduced motion: no running animations, tutor text appears at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(ACTIVITY);
  await expect(page.getByTestId("learning-stage")).toBeVisible();
  const dur = () => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dur-base")));
  expect(await dur()).toBe(0);

  // a wrong step triggers tutor feedback, focus effects and the typing bubble
  await divisionStep(page, 26, 12, 0);
  await expect(page.getByRole("status").filter({ hasText: "Not correct yet." })).toBeVisible();
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(page.getByText("Nudge")).toBeVisible();
  const running = await page.evaluate(() =>
    document.getAnimations().filter((a) => a.playState === "running").map((a) => (a.effect as KeyframeEffect | null)?.target?.getAttribute("class") ?? "?"),
  );
  expect(running).toEqual([]);
  await expect(page.locator("[class*='caret']")).toHaveCount(0);

  // control: without the preference, motion tokens are non-zero
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(await dur()).toBeGreaterThan(0);
});
