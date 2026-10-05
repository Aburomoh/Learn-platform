import { test, expect, type Page } from "@playwright/test";

/**
 * Chapter 1 regression (#216): one happy path per practice kind, each question finished correctly.
 * Already covered in smoke.spec.ts, not repeated here: repeated-division and the division-chain
 * read-off (guest flow), bit-grouping to digits for octal and hex, column-addition (binary addition).
 * Runs at desktop and mobile viewports.
 */

const COURSE = "/courses/ecet111";

const correct = (page: Page) => page.getByRole("status").filter({ hasText: "Correct." });

async function noPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Challenges run in order: a fresh guest starts at challenge 1, on the first variant. */
async function openQuestion(page: Page, path: string, label: string) {
  await page.goto(`${COURSE}/${path}/`);
  await expect(page.getByText(new RegExp(`^Challenge 1 of \\d+ · ${label}$`))).toBeVisible();
}

async function choose(page: Page, option: ReturnType<Page["getByRole"]>) {
  await option.check();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(correct(page)).toBeVisible();
}

test("base-to-decimal: (110.011)_2 by weights, terms and sum", async ({ page }) => {
  await openQuestion(page, "place-value/place-value", "Weight of a digit");
  // challenges 1 and 2 lead in: the weight of the 7 in 276.384 is 10^1 (4th option), the tenths digit is 3
  await choose(page, page.getByRole("radio").nth(3));
  await page.getByRole("button", { name: "Next challenge" }).click();
  await choose(page, page.getByRole("radio", { name: "3", exact: true }));
  await page.getByRole("button", { name: "Next challenge" }).click();
  await expect(page.getByText(/^Challenge 3 of \d+ · Binary → decimal$/)).toBeVisible();

  const digits = ["1", "1", "0", "0", "1", "1"];
  const powers = [2, 1, 0, -1, -2, -3];
  for (const [i, p] of powers.entries()) await page.getByLabel(`Power under digit ${i + 1} (${digits[i]})`).fill(String(p));
  await page.getByRole("button", { name: "Check weights" }).click();

  const terms = ["4", "2", "0", "0", "0.25", "0.125"];
  for (const [i, t] of terms.entries()) await page.getByLabel(`Value of ${digits[i]} × 2 to the ${powers[i]}`).fill(t);
  await page.getByRole("button", { name: "Check terms" }).click();

  await page.getByLabel("Sum in decimal").fill("6.375");
  await page.getByRole("button", { name: "Check sum" }).click();
  await expect(correct(page)).toBeVisible();
  await noPageOverflow(page);
});

test("multiple-choice: the hex digit for 11", async ({ page }) => {
  await openQuestion(page, "number-systems/hex-digits", "Decimal → hex");
  await choose(page, page.getByRole("radio", { name: "B", exact: true }));
});

test("digit replacement: (351)_8 to bits one digit at a time, then the decimal check", async ({ page }) => {
  await openQuestion(page, "digit-replacement/digit-replacement", "Octal → binary");
  await expect(page.getByRole("form", { name: "3 bits per octal digit" })).toBeVisible();
  for (const [i, [digit, bits]] of [["3", "011"], ["5", "101"], ["1", "001"]].entries()) {
    await expect(page.getByRole("textbox")).toHaveCount(1); // one digit at a time
    await page.getByLabel(`Digit ${i + 1} of 3, ${digit}: its 3 bits`).fill(bits);
    await page.keyboard.press("Enter");
  }
  await expect(correct(page)).toBeVisible();

  await page.getByRole("button", { name: "Next challenge" }).click();
  await page.getByRole("textbox").fill("233");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(correct(page)).toBeVisible();
  await noPageOverflow(page);
});

test("bit-grouping with a binary point: (11010110.1)_2 to octal, grouped outward from the point", async ({ page }) => {
  await openQuestion(page, "digit-replacement/binary-point", "Binary point");
  await expect(page.getByRole("form", { name: "Mark groups of 3 bits" })).toBeVisible();
  // 11010110.1 → 011 010 110 . 100: one zero in front, two at the end
  await page.getByRole("button", { name: "Add 0 in front" }).click();
  await page.getByRole("button", { name: "Add 0 at the end" }).click();
  await page.getByRole("button", { name: "Add 0 at the end" }).click();
  for (const n of [4, 7]) await page.getByRole("button", { name: new RegExp(`^Bit ${n} of 12: .*Start a new group here`) }).click();
  await page.getByRole("button", { name: "Check groups" }).click();

  for (const [i, [bits, digit]] of [["011", "3"], ["010", "2"], ["110", "6"], ["100", "4"]].entries()) {
    const input = page.getByLabel(`Group ${i + 1} of 4, ${bits}: octal digit`);
    await expect(input).toBeFocused();
    await input.fill(digit);
    await page.keyboard.press("Enter");
  }
  await expect(correct(page)).toBeVisible();
  await noPageOverflow(page);
});

test("numeric bit-row: the 1's complement of 100101, typed under each bit", async ({ page }) => {
  await openQuestion(page, "binary-arithmetic/complements", "1's complement");
  const answer = "011010";
  for (const [i, bit] of [..."100101"].entries()) await page.getByLabel(`Bit ${i + 1} of 6, under ${bit}`).fill(answer[i]);
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(correct(page)).toBeVisible();
  await noPageOverflow(page);
});
