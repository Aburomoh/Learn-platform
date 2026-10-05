import { test, expect, type Page } from "@playwright/test";

/**
 * Chapter 2 regression (#233): one happy path per practice kind, each question finished correctly.
 * Already covered elsewhere, not repeated here: circuit-predict value walk (smoke.spec.ts, logic
 * gates) and multiple-choice (chapter1.spec.ts). Runs at desktop and mobile viewports.
 */

const COURSE = "/courses/ecet111";

const correct = (page: Page) => page.getByRole("status").filter({ hasText: "Correct." });
/** Course text may print a prime as ' or ′. */
const primed = (text: string) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['′]")}$`);

async function noPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Challenges run in order: a fresh guest starts at challenge 1, on the first variant. */
async function openQuestion(page: Page, path: string, label: string) {
  await page.goto(`${COURSE}/${path}/`);
  await expect(page.getByText(new RegExp(`^Challenge 1 of \\d+ · ${label}$`))).toBeVisible();
}

async function nextChallenge(page: Page, n: number, label: string) {
  await page.getByRole("button", { name: "Next challenge" }).click();
  await expect(page.getByText(new RegExp(`^Challenge ${n} of \\d+ · ${label}$`))).toBeVisible();
}

/** Types one truth-table column top to bottom (keys 0/1 move down a row), then checks it. */
async function fillColumn(page: Page, header: string, bits: string) {
  await expect(page.getByRole("grid", { name: `Truth table, filling column ${header}` })).toBeVisible();
  await page.getByRole("gridcell", { name: new RegExp(`, column ${header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}, empty$`) }).first().focus();
  for (const b of bits) await page.keyboard.press(b);
  await page.getByRole("button", { name: "Check column" }).click();
}

test("truth-table fill: NAND through its AND column, column by column", async ({ page }) => {
  await openQuestion(page, "derived-gates/derived-gates", "NAND");
  await fillColumn(page, "A·B", "0001");
  await fillColumn(page, "(A·B)′", "1110");
  await expect(correct(page)).toBeVisible();
  await noPageOverflow(page);
});

test("row-select and expression: tick F's 1-rows, then write the SOP from them", async ({ page }) => {
  await openQuestion(page, "sop-and-pos/sop-and-pos", "SOP or POS");
  // lead-in 1: the POS of AB' + A'C + BC
  await page.getByRole("radio", { name: primed("(A + B')(A' + C)") }).check();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(correct(page)).toBeVisible();
  // lead-in 2: F = A'BC' + AB'C + ABC' (rows 2, 5, 6), product by product, then F
  await nextChallenge(page, 2, "SOP → table");
  await fillColumn(page, "A′BC′", "00100000");
  await fillColumn(page, "AB′C", "00000100");
  await fillColumn(page, "ABC′", "00000010");
  await fillColumn(page, "F", "00100110");
  await expect(correct(page)).toBeVisible();

  // row-select: F = 1 on rows 1, 4, 6
  await nextChallenge(page, 3, "Tick the 1-rows");
  for (const row of ["0 0 1", "1 0 0", "1 1 0"]) await page.getByRole("gridcell", { name: `Row ${row}, not picked` }).click();
  await page.getByRole("button", { name: "Check rows" }).click();
  await expect(correct(page)).toBeVisible();

  // expression: one product per 1-row
  await nextChallenge(page, 4, "1-rows → SOP");
  await page.getByRole("textbox").fill("A'B'C + AB'C' + ABC'");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(correct(page)).toBeVisible();
  await noPageOverflow(page);
});

test("circuit-predict expression mode: write each gate's output, from the inputs to F", async ({ page }) => {
  await openQuestion(page, "circuits-expressions/circuit-to-expression", "Gate by gate");
  // NOT(A) → OR with B → AND with C
  for (const [gate, expr] of [["NOT", "A'"], ["OR", "A' + B"], ["AND", "(A' + B)C"]]) {
    const field = page.getByRole("textbox", { name: new RegExp(`^Expression at the output of the ${gate} gate`) });
    await field.fill(expr);
    await page.getByRole("button", { name: "Check", exact: true }).click();
  }
  await expect(correct(page)).toBeVisible();
  await noPageOverflow(page);
});

test("derivation: simplify x'y'z + x'yz + xy' law by law", async ({ page }) => {
  await openQuestion(page, "simplification/simplification", "Law, then line");
  const steps: [string, string][] = [
    ["Distributive (multiply out or factor)", "x'z(y' + y) + xy'"],
    ["A + A′ = 1", "x'z·1 + xy'"],
    ["A · 1 = A", "x'z + xy'"],
  ];
  for (const [i, [law, line]] of steps.entries()) {
    await expect(page.getByText(`Line ${i + 2} of 4: name the law`)).toBeVisible();
    await page.getByRole("radio", { name: law, exact: true }).check();
    await page.getByRole("button", { name: "Check law" }).click();
    await expect(page.getByText(`Line ${i + 2} of 4: give the line`)).toBeVisible();
    await page.getByRole("radio", { name: primed(line) }).check();
    await page.getByRole("button", { name: "Check line" }).click();
  }
  await expect(correct(page)).toBeVisible();
  await noPageOverflow(page);
});
