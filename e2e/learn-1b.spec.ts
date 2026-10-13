import { test, expect, type Page } from "@playwright/test";

// Learning architecture step 1b (#691): the help row under the stage. Explain Slowly opens before
// any attempt; Hint before the first input is answered, not greyed out, and opens after the first
// input; "I'm stuck" grants the lowest rung and offers the two ways on; a walkthrough past step 0
// asks first; a named mistake stays beside the hint. The tests set their own viewport, so both
// Playwright projects measure both widths.

const DIVISION = "/courses/ecet111/number-systems/decimal-to-binary/";
const CHOICE = "/courses/cpet181/record-organization/organizations/";

const stage = (page: Page) => page.getByTestId("learning-stage");
const controls = (page: Page) => page.getByTestId("stage-controls");
const bubble = (page: Page) => page.locator("[data-tutor-text]");
const hintCards = (page: Page) => page.getByRole("region", { name: "Hints" }).getByRole("listitem");

/** The runner has attached: input is handled (before that a fill can be lost; #708 is the fix, #711). */
async function open(page: Page, url: string) {
  await page.goto(url);
  await page.waitForFunction(() => {
    const el = document.querySelector("[data-testid=learning-stage]");
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber"));
  });
}

async function divisionStep(page: Page, dividend: number, quotient: number, remainder: number) {
  await page.getByLabel(`${dividend} divided by 2: result`).fill(String(quotient));
  await page.getByLabel(`${dividend} divided by 2: remainder`).fill(String(remainder));
  await page.getByRole("button", { name: "Check step" }).click();
}

for (const [width, height] of [
  [390, 844],
  [1280, 800],
] as const) {
  test(`Explain slowly opens before any attempt at ${width}×${height}; Hint is answered before the first input and opens after it`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page, DIVISION);
    await expect(stage(page)).toHaveAttribute("data-stage", "await_answer");
    const row = controls(page).getByRole("group", { name: "Get help", exact: true });
    for (const name of ["Hint", "I'm stuck", "Explain slowly"]) await expect(row.getByRole("button", { name })).toBeEnabled();
    // nothing in the row pulses or is greyed out; the ⋯ menu is last in it
    await expect(row.getByRole("button", { name: "More" })).toBeVisible();

    // Hint before any input (after the silent 5 s reflex guard): a tutor line, no hint card, the button stays enabled
    await page.waitForTimeout(5100);
    await row.getByRole("button", { name: "Hint" }).click();
    await expect(bubble(page)).toContainText(/one try first/);
    await expect(hintCards(page)).toHaveCount(0);
    await expect(row.getByRole("button", { name: "Hint" })).toBeEnabled();

    // the first input engages the step (a field kind): now Hint opens the ladder (after the 5 s reflex guard)
    await page.getByLabel("26 divided by 2: result").fill("1");
    await expect(stage(page)).toHaveAttribute("data-engaged", "true");
    await row.getByRole("button", { name: "Hint" }).click();
    await expect(hintCards(page)).toHaveCount(1);
    await expect(row.getByRole("button", { name: "Another hint" })).toBeEnabled();

    // Explain slowly at step 0: opens the walkthrough at once, no warning
    await row.getByRole("button", { name: "Explain slowly" }).click();
    await expect(stage(page)).toHaveAttribute("data-stage", "explaining");
    await expect(page.getByText("Step 1 of 7")).toBeVisible();
    await expect(controls(page)).toHaveCount(0);
  });

  test(`I'm stuck at ${width}×${height}: the lowest rung, then the two ways on; the offer chips work`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page, DIVISION);
    await expect(stage(page)).toHaveAttribute("data-stage", "await_answer");
    await page.waitForTimeout(5100);
    const row = controls(page).getByRole("group", { name: "Get help", exact: true });
    await row.getByRole("button", { name: "I'm stuck" }).click();
    await expect(hintCards(page)).toHaveCount(1);
    await expect(hintCards(page).first()).toContainText("Nudge");
    await expect(bubble(page)).toContainText(/another hint|explain it slowly/i);
    const offer = controls(page).getByRole("group", { name: "Help", exact: true });
    await expect(offer.getByRole("button", { name: "Show a hint" })).toBeVisible();
    await expect(offer.getByRole("button", { name: "Explain slowly" })).toBeVisible();
    await offer.getByRole("button", { name: "Show a hint" }).click();
    await expect(hintCards(page)).toHaveCount(2);
    await expect(controls(page).getByRole("group", { name: "Help", exact: true })).toHaveCount(0);
    // no horizontal overflow with the row and the cards on screen
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test(`a walkthrough past step 0 at ${width}×${height} asks first: Not now keeps the step, Go ahead opens it`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page, DIVISION);
    await divisionStep(page, 26, 13, 0);
    await expect(page.getByLabel("13 divided by 2: result")).toBeVisible();
    const row = controls(page).getByRole("group", { name: "Get help", exact: true });
    await row.getByRole("button", { name: "Explain slowly" }).click();
    await expect(bubble(page)).toContainText(/worked example/);
    const ask = controls(page).getByRole("group", { name: "Start again with new numbers?" });
    await ask.getByRole("button", { name: "Not now" }).click();
    await expect(controls(page).getByRole("group", { name: "Start again with new numbers?" })).toHaveCount(0);
    await expect(page.getByLabel("13 divided by 2: result")).toBeVisible();
    await expect(stage(page)).toHaveAttribute("data-stage", "await_answer");
    await row.getByRole("button", { name: "Explain slowly" }).click();
    await ask.getByRole("button", { name: "Go ahead" }).click();
    await expect(stage(page)).toHaveAttribute("data-stage", "explaining");
  });
}

test("a named mistake stays as the first card beside the hint (#700); a single-pick kind engages on Check only", async ({ page }) => {
  await open(page, DIVISION);
  // quotient and remainder swapped on the second step (13 ÷ 2 = 6 r 1 → 1 r 6): the tutor names it
  await divisionStep(page, 26, 13, 0);
  await expect(page.getByLabel("13 divided by 2: result")).toBeVisible();
  await divisionStep(page, 13, 1, 6);
  await expect(page.getByRole("status").filter({ hasText: "Not correct yet." })).toBeVisible();
  const cards = hintCards(page);
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("What went wrong");
  await expect(cards.first()).toContainText(/swapped/i);
  await controls(page).getByRole("button", { name: "Hint" }).click();
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText("What went wrong");

  await open(page, CHOICE);
  await expect(stage(page)).toHaveAttribute("data-stage", "await_answer");
  await page.getByRole("radio").nth(1).check({ force: true });
  await expect(stage(page)).not.toHaveAttribute("data-engaged", "true");
  await page.getByRole("button", { name: /^Check/ }).click();
  await expect(stage(page)).toHaveAttribute("data-engaged", "true");
});
