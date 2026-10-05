import { test, expect, type Page } from "@playwright/test";

/**
 * Chapter 4 regression (#251): one happy path per practice kind, each question finished correctly.
 * New kinds here: device (decoder, encoder) and the truth table's mux-pairs mode. Its K-map,
 * truth-table fill, row-select, circuit walk, derivation, expression and multiple-choice questions
 * use controls covered by chapter1–3.spec.ts and smoke.spec.ts. Runs at desktop and mobile viewports.
 */

const COURSE = "/courses/ecet111";

const correct = (page: Page) => page.getByRole("status").filter({ hasText: "Correct." });

async function noPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("device, decoder: x y z = 1 1 0 makes D6 the active output", async ({ page }) => {
  await page.goto(`${COURSE}/decoders-encoders/decoders/`);
  const outputs = page.getByRole("radiogroup", { name: "Which output is 1?" });
  await expect(outputs.getByRole("radio")).toHaveCount(8);
  await outputs.getByRole("radio", { name: "D6" }).check();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(correct(page)).toBeVisible();
  await expect(page.getByRole("img", { name: /Answer: D6\./ })).toBeVisible();
  await noPageOverflow(page);
});

test("device, encoder: only I6 is 1, so the code is 110", async ({ page }) => {
  await page.goto(`${COURSE}/decoders-encoders/encoders/`);
  const codes = page.getByRole("radiogroup", { name: "Output code" });
  await codes.getByRole("radio", { name: "110" }).check();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(correct(page)).toBeVisible();
  await noPageOverflow(page);
});

test("truth-table mux-pairs: Σ(1, 2, 6, 7) on a 4-to-1 MUX, one pair of rows at a time", async ({ page }) => {
  await page.goto(`${COURSE}/multiplexers/mux-functions/`);
  // lead-in: which variables go on the selects
  await page.getByRole("radio", { name: "x → S1, y → S0" }).check();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(correct(page)).toBeVisible();
  await page.getByRole("button", { name: "Next challenge" }).click();

  await expect(page.getByRole("grid", { name: "Truth table, MUX input per pair of rows" })).toBeVisible();
  for (const [i, input] of ["z", "z′", "0", "1"].entries()) {
    await expect(page.getByText(`Pair ${i + 1} of 4: what goes on I${i}?`)).toBeVisible();
    await page.getByRole("radiogroup", { name: /Data input I\d/ }).getByRole("radio", { name: input, exact: true }).check();
    await page.getByRole("button", { name: "Check input" }).click();
  }
  await expect(correct(page)).toBeVisible();
  await expect(page.locator("[data-pair]")).toHaveText(["I0 = z", "I1 = z′", "I2 = 0", "I3 = 1"]);
  await noPageOverflow(page);
});
