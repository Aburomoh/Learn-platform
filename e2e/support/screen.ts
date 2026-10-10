import { expect, type Page } from "@playwright/test";

/** The two widths QA checks every new screen at (ADR-0010). */
export const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1280, height: 800 },
} as const;

/** No horizontal page scroll. */
export async function expectNoHorizontalOverflow(page: Page) {
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(extra, "horizontal overflow (px)").toBeLessThanOrEqual(0);
}

/** Every visible text node renders at 12 px or larger. */
export async function expectMinTextSize(page: Page, min = 12) {
  const small = await page.evaluate((min) => {
    const out: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || !n.textContent?.trim() || !el.getClientRects().length) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < min) out.push(`${size}px: ${n.textContent.trim().slice(0, 40)}`);
    }
    return out;
  }, min);
  expect(small, `text below ${min}px`).toEqual([]);
}

/** Nothing revealed early: none of the given answers/solutions are visible before the student acts. */
export async function expectNotRevealed(page: Page, secrets: (string | RegExp)[]) {
  for (const s of secrets) await expect(page.getByText(s)).toHaveCount(0);
}

/** Runs the standard checks at the current viewport. */
export async function checkScreen(page: Page, secrets: (string | RegExp)[] = []) {
  await expectNoHorizontalOverflow(page);
  await expectMinTextSize(page);
  await expectNotRevealed(page, secrets);
}
