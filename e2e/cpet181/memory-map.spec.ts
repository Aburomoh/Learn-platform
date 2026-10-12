import { expect, test, type Page } from "@playwright/test";
import { checkScreen } from "../support/screen";

// Regression happy path for the memory-map kind (CPET181 C2, gate #530): attempt, feedback, hint, retry.
// The expected answers are computed here from the drawn memory (aria-label), not read from src/content.

interface Region {
  free: boolean;
  job: string | null;
  start: number;
  size: number;
}

/** "Memory, … OS 0 to 10. partition 1 free at 10, 100 KB; … 0 of 5 steps done." → regions in address order. */
function parseMemory(summary: string): Region[] {
  const body = summary.replace(/^Memory,[^.]*\.\s*OS 0 to \d+\.\s*/, "").replace(/\s*\d+ of \d+ steps done\.?.*$/, "");
  return body
    .split(/;\s*/)
    .map((s) => {
      const m = s.match(/^(.*?) at (\d+), (\d+) KB/);
      if (!m) return null;
      const free = /free/.test(m[1]);
      return { free, job: free ? null : m[1], start: +m[2], size: +m[3] };
    })
    .filter((r): r is Region => r !== null);
}

async function memorySummary(page: Page): Promise<string> {
  // The drawn memory's text alternative: "Memory, fixed partitions, first-fit. OS 0 to 10. … 0 of 5 steps done."
  const text = await page.locator("main").innerText();
  const found = text.match(/Memory, [^\n]*/)?.[0];
  if (!found) throw new Error("no memory summary on the screen");
  return found;
}

const status = (page: Page) => page.locator("[role=status]");

test("memory-map kind: attempt, feedback, hint, retry", async ({ page }) => {
  await page.goto("/courses/cpet181/fixed-partitions/fixed-partitions/");
  await expect(page.getByText(/CHALLENGE 1 OF \d+/i)).toBeVisible();
  await checkScreen(page);

  // Step 1: the first job fits a free partition, so "Waits" is a wrong attempt with feedback.
  const first = await memorySummary(page);
  const free = parseMemory(first).filter((r) => r.free);
  const need = Number((await page.getByText(/Job \w+ \(\d+ KB\), first-fit/).first().innerText()).match(/\((\d+) KB\)/)![1]);
  expect(free.some((r) => r.size >= need), "the first job fits somewhere").toBe(true);
  await page.getByRole("radio", { name: /Waits/ }).check({ force: true });
  await page.getByRole("button", { name: "Place job" }).click();
  await expect(status(page).filter({ hasText: /Not (quite|correct)/ })).toBeVisible();

  // A hint is offered and shown.
  const before = (await page.locator("main").innerText()).length;
  await page.getByRole("button", { name: "Hint" }).click();
  await expect.poll(async () => (await page.locator("main").innerText()).length).toBeGreaterThan(before);

  // Solve the whole question: first-fit takes the first free partition that is large enough; then the waste.
  for (let guard = 0; guard < 12; guard++) {
    const main = await page.locator("main").innerText();
    if (/Correct\./.test(main) && (await page.getByRole("button", { name: "Place job" }).count()) === 0 && (await page.getByRole("button", { name: /^Check/ }).count()) === 0) break;
    const step = main.match(/Step \d+ of \d+ · ([^\n]*)/)?.[1] ?? "";
    if (/which partition/.test(step)) {
      const size = Number(step.match(/\((\d+) KB\)/)![1]);
      const regions = parseMemory(await memorySummary(page)).filter((r) => r.free);
      const idx = regions.findIndex((r) => r.size >= size);
      if (idx >= 0) await page.getByRole("radio").nth(idx).check({ force: true });
      else await page.getByRole("radio", { name: /Waits/ }).check({ force: true });
      await page.getByRole("button", { name: "Place job" }).click();
    } else if (/Internal waste/.test(step)) {
      const rows = page.locator("table input");
      for (let i = 0; i < (await rows.count()); i++) {
        const t = await rows.nth(i).evaluate((x) => (x.closest("tr") as HTMLElement).innerText);
        const m = t.match(/^(\d+)\s+(\d+)\s+\d+\s+busy\W+\w+ · (\d+) KB/); // "busy" over "J1 · 30 KB" since #668
        await rows.nth(i).fill(String(m ? Number(m[2]) - Number(m[3]) : 0));
      }
      await page.getByRole("button", { name: /^Check/ }).click();
    } else throw new Error(`unexpected step: ${step}`);
    await page.waitForTimeout(150);
  }
  await expect(status(page).filter({ hasText: /^Correct/ }).first()).toBeVisible();

  // Retry: a similar question draws a different memory.
  await page.getByRole("button", { name: "Try a similar one" }).click();
  await expect.poll(async () => memorySummary(page)).not.toBe(first);
  await expect(page.getByText(/Step 1 of \d+/)).toBeVisible();
  await checkScreen(page);
});
