import { test, expect, type Page } from "@playwright/test";

/**
 * Chapter 5 regression (#252): one happy path per practice kind, each question finished correctly.
 * Covered elsewhere, not repeated here: multiple-choice (chapter1.spec.ts), truth-table fill and
 * expression (chapter2.spec.ts), K-maps (chapter3.spec.ts). The state table below is the
 * Chapter 5 layout of the truth-table kind (grouped present / input / next-state columns).
 * Runs at desktop and mobile viewports.
 */

const COURSE = "/courses/ecet111";

const correct = (page: Page) => page.getByRole("status").filter({ hasText: "Correct." });

async function noPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

async function openQuestion(page: Page, path: string, label: string) {
  await page.goto(`${COURSE}/${path}/`);
  await expect(page.getByText(new RegExp(`^Challenge 1 of \\d+ · ${label}$`))).toBeVisible();
}

/** One edge at a time: pick Q just after the edge, then check it. */
async function placeQ(page: Page, levels: string) {
  const bits = levels.split(" ");
  for (const [i, bit] of bits.entries()) {
    await expect(page.getByText(new RegExp(`^Edge ${i + 1} of ${bits.length} `))).toBeVisible();
    await page.getByRole("radiogroup", { name: `Q after edge ${i + 1}` }).getByRole("radio", { name: bit, exact: true }).check();
    await page.getByRole("button", { name: "Check edge" }).click();
  }
}

/** Types one truth-table column top to bottom (keys 0/1 move down a row), then checks it. */
async function fillColumn(page: Page, header: string, bits: string) {
  await expect(page.getByRole("grid", { name: `Truth table, filling column ${header}` })).toBeVisible();
  await page.getByRole("gridcell", { name: new RegExp(`, column ${header}, empty$`) }).first().focus();
  for (const b of bits) await page.keyboard.press(b);
  await page.getByRole("button", { name: "Check column" }).click();
}

test("timing: SR flip-flop on rising edges, then D on falling edges, Q placed edge by edge", async ({ page }) => {
  await openQuestion(page, "timing/timing-diagrams", "Rising edges");
  await placeQ(page, "0 1 0 1 1");
  await expect(correct(page)).toBeVisible();
  await noPageOverflow(page);

  await page.getByRole("button", { name: "Next challenge" }).click();
  await expect(page.getByText(/^Challenge 2 of \d+ · Falling edges$/)).toBeVisible();
  await placeQ(page, "1 1 0 1 0");
  await expect(correct(page)).toBeVisible();
  await noPageOverflow(page);
});

test("state diagram: label every arrow input/output, in table order", async ({ page }) => {
  await openQuestion(page, "analysis/analysis-diagram", "State diagram");
  const arrows: [string, string, string][] = [
    ["00", "00", "0/0"],
    ["00", "01", "1/0"],
    ["01", "00", "0/1"],
    ["01", "11", "1/0"],
    ["10", "00", "0/1"],
    ["10", "10", "1/0"],
    ["11", "00", "0/1"],
    ["11", "10", "1/0"],
  ];
  for (const [i, [from, to, label]] of arrows.entries()) {
    await expect(page.getByText(new RegExp(`^Arrow ${i + 1} of 8: ${from} → ${to}`))).toBeVisible();
    await page.getByRole("radiogroup", { name: `Label of the arrow from ${from} to ${to}` }).getByRole("radio", { name: label, exact: true }).check();
    await page.getByRole("button", { name: "Check arrow" }).click();
  }
  await expect(correct(page)).toBeVisible();
  await noPageOverflow(page);
});

test("state table: flip-flop inputs, next state and output, one column at a time", async ({ page }) => {
  await openQuestion(page, "analysis/analysis-table", "State table");
  // D flip-flops: DA = Ax + Bx, DB = A'x, A(t+1) = DA, B(t+1) = DB, y = (A + B)x', rows A B x in binary order
  await fillColumn(page, "DA", "00010101");
  await fillColumn(page, "DB", "01010000");
  await fillColumn(page, "A", "00010101");
  await fillColumn(page, "B", "01010000");
  await fillColumn(page, "y", "00101010");
  await expect(correct(page)).toBeVisible();
  await noPageOverflow(page);
});
