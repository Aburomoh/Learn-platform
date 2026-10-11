import { expect, test, type Page } from "@playwright/test";
import { checkScreen } from "../support/screen";

// Regression happy path for CPET181 C3 (gate #531): the numeric kind with the page and segment table
// figures. The expected answers are computed here from the table drawn on the screen.

const status = (page: Page) => page.locator("[role=status]");

async function lines(page: Page): Promise<string[]> {
  return (await page.locator("main").innerText()).split("\n").map((l) => l.trim()).filter(Boolean);
}

test("paged translation: read the page map table, attempt, feedback, hint, retry", async ({ page }) => {
  await page.goto("/courses/cpet181/paged-translation/translate/");
  await expect(page.getByText(/page map table is in the figure/)).toBeVisible();
  await checkScreen(page);

  const solve = async () => {
    const ls = await lines(page);
    const prompt = ls.find((l) => /What is the physical address of the byte at address \d+ of the job\?/.test(l))!;
    const size = Number(prompt.match(/are (\d+) bytes/)?.[1] ?? ls.find((l) => /page size and the frame size are \d+ bytes/.test(l))!.match(/are (\d+) bytes/)![1]);
    const address = Number(prompt.match(/address (\d+) of the job/)![1]);
    const frames = new Map<number, number>();
    for (let i = 0; i < ls.length - 1; i++) {
      if (/^\d+$/.test(ls[i]) && /^\d+$/.test(ls[i + 1]) && Number(ls[i]) < 64 && !frames.has(Number(ls[i]))) {
        frames.set(Number(ls[i]), Number(ls[i + 1]));
        i++;
      }
    }
    const frame = frames.get(Math.floor(address / size));
    expect(frame, `page ${Math.floor(address / size)} is in the table`).toBeDefined();
    return frame! * size + (address % size);
  };

  const answer = await solve();
  const input = page.locator("main input:not([type=radio])").first();

  // Attempt: a wrong number gets feedback; a hint is offered and shown.
  await input.fill(String(answer + 1));
  await page.getByRole("button", { name: /^Check/ }).click();
  await expect(status(page).filter({ hasText: /Not (quite|correct)/ })).toBeVisible();
  const before = (await page.locator("main").innerText()).length;
  await page.getByRole("button", { name: "Hint" }).click();
  await expect.poll(async () => (await page.locator("main").innerText()).length).toBeGreaterThan(before);

  await input.fill(String(answer));
  await page.getByRole("button", { name: /^Check/ }).click();
  await expect(status(page).filter({ hasText: /^Correct/ }).first()).toBeVisible();

  // Retry: a similar question has its own table and still answers from what is drawn.
  await page.getByRole("button", { name: "Try a similar one" }).click();
  await expect(page.getByText(/page map table is in the figure/)).toBeVisible();
  const second = await solve();
  await page.locator("main input:not([type=radio])").first().fill(String(second));
  await page.getByRole("button", { name: /^Check/ }).click();
  await expect(status(page).filter({ hasText: /^Correct/ }).first()).toBeVisible();
  await checkScreen(page);
});

test("segment translation: base of the segment plus the displacement", async ({ page }) => {
  await page.goto("/courses/cpet181/segment-translation/segment-address/");
  await expect(page.getByText(/segment map table of a job is in the figure/)).toBeVisible();
  await checkScreen(page);

  const ls = await lines(page);
  const prompt = ls.find((l) => /physical address of segment \d+, displacement \d+\?/.test(l))!;
  const [, segment, displacement] = prompt.match(/segment (\d+), displacement (\d+)\?/)!.map(Number);
  // rows are "<n> <name>", then size, then address
  let base = NaN;
  for (let i = 0; i < ls.length - 2; i++) {
    if (new RegExp(`^${segment} \\D`).test(ls[i]) && /^\d+$/.test(ls[i + 1]) && /^\d+$/.test(ls[i + 2])) base = Number(ls[i + 2]);
  }
  expect(base, `segment ${segment} is in the table`).not.toBeNaN();

  await page.locator("main input:not([type=radio])").first().fill(String(base + displacement));
  await page.getByRole("button", { name: /^Check/ }).click();
  await expect(status(page).filter({ hasText: /^Correct/ }).first()).toBeVisible();
});
