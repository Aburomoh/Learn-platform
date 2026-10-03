import { test, expect, type Page } from "@playwright/test";

/**
 * Core student flow (docs/MILESTONES.md, M1 acceptance):
 * open → choose course → open activity → wrong answer → feedback → hint → Explain Slowly →
 * retry → correct → progress survives reload. Runs at desktop and mobile viewports.
 */

const ACTIVITY = "/courses/digital-logic-demo/number-systems/decimal-to-binary/";

async function placeBit(page: Page, slotIndexFromLeft: number) {
  const piece = page.getByRole("button", { name: "1", exact: true });
  await piece.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Home");
  for (let i = 0; i < slotIndexFromLeft; i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
}

test("home lists the demo course and navigates to an activity", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("DEMO / NOT AUTHORITATIVE COURSE CONTENT")).toBeVisible();
  await page.getByRole("link", { name: /Digital Logic Fundamentals/ }).click();
  await page.getByRole("link", { name: /Number systems/ }).click();
  await page.getByRole("link", { name: /Decimal to binary/ }).click();
  await expect(page.getByTestId("learning-stage")).toBeVisible();
  // no horizontal overflow at this viewport
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("guest flow: wrong → feedback → hint → explain slowly → retry → correct → reload keeps progress", async ({ page }) => {
  const requests: string[] = [];
  await page.goto(ACTIVITY);
  await expect(page.getByTestId("learning-stage")).toBeVisible();
  page.on("request", (r) => requests.push(r.url()));

  // 1. wrong answer (32 and 16 lit → extra-place misconception)
  await placeBit(page, 0);
  await placeBit(page, 1);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Not correct yet." })).toBeVisible();
  await expect(page.getByTestId("learning-stage")).toHaveAttribute("data-stage", "await_retry");
  await expect(page.locator("[data-expression='thinking']:visible")).toBeVisible();

  // 2. hint ladder: first hint is a nudge, second a concept reminder
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(page.getByText("Nudge")).toBeVisible();
  await page.getByRole("button", { name: "Another hint" }).click();
  await expect(page.getByText("Concept")).toBeVisible();

  // 3. Explain Slowly: steps with a prediction before reveal
  await page.getByRole("button", { name: "Explain slowly" }).click();
  await expect(page.getByText("Step 1 of 6")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("[data-prediction]").getByText("Does 32 fit in 45?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page.locator("[data-prediction]").getByRole("status")).toContainText("13 remains");
  const stage = page.getByTestId("learning-stage");
  for (let i = 0; i < 10 && (await stage.getAttribute("data-stage")) === "explaining"; i++) {
    const pending = page.locator("[data-prediction] button:not([disabled])");
    if ((await pending.count()) > 0) await pending.first().click();
    await page.getByRole("button", { name: /Continue|Now I try/ }).click();
  }

  // 4. retry: inputs reset, then the correct answer completes the question
  await expect(page.getByTestId("learning-stage")).toHaveAttribute("data-stage", "await_retry");
  await expect(page.getByText("Total so far:")).toContainText("0");
  for (const idx of [0, 2, 3, 5]) await placeBit(page, idx);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Correct." })).toBeVisible();
  await expect(page.locator("[data-expression='pleased']:visible")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try a similar one" })).toBeVisible();

  // 5. no server or third-party calls during the interaction: only same-origin static assets
  //    (Next.js chunk/prefetch files) are allowed.
  const origin = new URL(page.url()).origin;
  const nonStatic = requests.filter((u) => !u.startsWith("data:") && !(u.startsWith(origin) && /\/_next\/|\/__next\./.test(u)));
  expect(nonStatic).toEqual([]);

  // 6. progress persisted locally and visible after reload
  await page.waitForTimeout(1200); // debounced write
  const stored = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("cet-learn:v1:progress:")));
  expect(stored).toHaveLength(1);
  await page.goto("/courses/digital-logic-demo/number-systems/");
  await expect(page.getByTestId("status-decimal-to-binary")).toHaveText("Started");
});

test("logic gates activity: predict output, then explore inputs after completion", async ({ page }) => {
  await page.goto("/courses/digital-logic-demo/logic-gates/predict-gate-output/");
  await expect(page.getByRole("img", { name: /Circuit with NOT, AND, OR/ })).toBeVisible();
  await page.getByLabel(/Y = 0/).check();
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Not correct yet." })).toBeVisible();
  await page.getByLabel(/Y = 1/).check();
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Correct." })).toBeVisible();
  // explore mode: inputs become switches and Y updates live
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
