import { test, expect, type Page } from "@playwright/test";

/**
 * Chapter 3 regression (#250): one happy path per practice kind, each question finished correctly.
 * The only new kind in Chapter 3 is the K-map; its multiple-choice and derivation questions are
 * covered by chapter1.spec.ts and chapter2.spec.ts. Runs at desktop and mobile viewports.
 */

const COURSE = "/courses/ecet111";

const correct = (page: Page) => page.getByRole("status").filter({ hasText: "Correct." });
const cell = (page: Page, m: number) => page.getByRole("gridcell", { name: new RegExp(`^m${m},`) });

/** Minterms in the map's reading order: rows top to bottom, Gray-order columns (00 01 11 10). */
const READING: Record<number, number[]> = {
  3: [0, 1, 3, 2, 4, 5, 7, 6],
  4: [0, 1, 3, 2, 4, 5, 7, 6, 12, 13, 15, 14, 8, 9, 11, 10],
};

async function noPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Types every cell in reading order (typing moves on), then checks the map. */
async function fillMap(page: Page, vars: number, ones: number[], dontCares: number[] = []) {
  const order = READING[vars];
  await cell(page, order[0]).focus();
  for (const m of order) await page.keyboard.press(ones.includes(m) ? "1" : dontCares.includes(m) ? "x" : "0");
  await page.getByRole("button", { name: "Check map" }).click();
}

/** Taps a group's cells, checks it, then writes its term. */
async function group(page: Page, n: number, cells: number[], term: string) {
  await expect(page.getByText(new RegExp(`^Group ${n} of \\d+: tap its cells, then check\\.$`))).toBeVisible();
  for (const m of cells) await cell(page, m).click();
  await page.getByRole("button", { name: "Check group" }).click();
  await page.getByRole("textbox", { name: new RegExp(`Term for group ${n}`) }).fill(term);
  await page.getByRole("button", { name: "Check", exact: true }).click();
}

async function finalF(page: Page, f: string) {
  await page.getByRole("textbox", { name: /F, the simplified function/ }).fill(f);
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(correct(page)).toBeVisible();
}

test("kmap, 3 variables: fill Σ(3, 4, 6, 7), group BC and the wrapping AC′, then F", async ({ page }) => {
  await page.goto(`${COURSE}/kmap-three/kmap-three/`);
  await expect(page.getByRole("grid", { name: "Karnaugh map, A by BC" })).toBeVisible();
  await fillMap(page, 3, [3, 4, 6, 7]);
  await group(page, 1, [3, 7], "BC");
  await group(page, 2, [4, 6], "AC'");
  await finalF(page, "AC' + BC");
  await noPageOverflow(page);
});

test("kmap, 4 variables: fill a 4 × 4 map, an 8-cell group and two pairs, then F", async ({ page }) => {
  await page.goto(`${COURSE}/kmap-four/kmap-four/`);
  await expect(page.getByRole("grid", { name: "Karnaugh map, AB by CD" })).toBeVisible();
  await fillMap(page, 4, [3, 5, 8, 9, 10, 11, 12, 13, 14, 15]);
  await group(page, 1, [8, 9, 10, 11, 12, 13, 14, 15], "A");
  await group(page, 2, [5, 13], "BC'D");
  await group(page, 3, [3, 11], "B'CD");
  await finalF(page, "A + BC'D + B'CD");
  await noPageOverflow(page);
});

test("kmap with don't cares: X cells typed as x, one group that uses them, F = C", async ({ page }) => {
  await page.goto(`${COURSE}/kmap-dont-cares/kmap-dont-cares/`);
  await expect(page.getByRole("grid", { name: "Karnaugh map, A by BC" })).toBeVisible();
  await fillMap(page, 3, [1, 5, 7], [0, 3, 6]);
  await group(page, 1, [1, 3, 5, 7], "C");
  await finalF(page, "C");
  await noPageOverflow(page);
});
