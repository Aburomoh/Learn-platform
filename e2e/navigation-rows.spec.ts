import { test, expect } from "@playwright/test";

// Epic #670 Phase 1, UI A (#673): rows name what they open, practices show their kind before
// entry, the recommended order is a caption, not a gate. Both widths from each Playwright project.

for (const [width, height] of [
  [390, 844],
  [1280, 800],
] as const) {
  test(`course page at ${width}: topic rows list their practices, open the topic or start the one practice; one Recommended next (#673)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/courses/ecet111/");
    await expect(page.locator("[aria-busy='true']")).toHaveCount(0);
    // the first topic (one practice) carries the filled button, which names its practice, under a caption
    const filled = page.locator("[data-primary-action]");
    await expect(filled).toHaveCount(1);
    await expect(filled).toHaveText(/^Start · Place value and base → decimal/);
    await expect(page.getByText("Recommended next")).toHaveCount(1);
    // Binary arithmetic has eight practices: the quiet link opens the topic, the row names the practices
    const arithmetic = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: "Binary arithmetic", exact: true }) });
    await expect(arithmetic.getByRole("link", { name: "Open topic: Binary arithmetic" })).toHaveAttribute("href", /\/courses\/ecet111\/binary-arithmetic\/?$/);
    const line = arithmetic.locator("[data-practices]");
    await expect(line).toHaveAttribute("data-practices", "8");
    await expect(line).toContainText("Binary addition");
    // phones show two titles and "+6 more"; wide shows four and "+4 more"
    await expect(line.getByText(width < 641 ? "+6 more" : "+4 more")).toBeVisible();
    await expect(line.getByText(width < 641 ? "+4 more" : "+6 more")).toBeHidden();
    const subtraction = line.getByText("Subtraction by 2's complement");
    if (width < 641) await expect(subtraction).toBeHidden();
    else await expect(subtraction).toBeVisible();
    // a one-practice topic goes straight to its practice, by name
    const hex = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: "Octal and hex ↔ binary", exact: true }) });
    await expect(hex.locator("[data-practices]")).toHaveAttribute("data-practices", "2");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test(`topic page at ${width}: 'Practices:' line, two-line practice rows with kind words and steps, actions that name the practice (#673)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/courses/ecet111/binary-arithmetic/");
    await expect(page.locator("[aria-busy='true']")).toHaveCount(0);
    await expect(page.getByText(/^Practices: Binary addition · 1's and 2's complement · Subtraction by 2's complement/)).toBeVisible();
    await expect(page.locator("[data-primary-action]")).toHaveText(/^Start · Binary addition/);
    await expect(page.getByText("Recommended next")).toBeVisible();
    const rows = page.getByRole("region", { name: "Practices in this topic" }).getByRole("listitem");
    await expect(rows).toHaveCount(8);
    await expect(rows.nth(0)).toHaveAttribute("data-up-next", "true");
    // the subtraction row: its kind in plain words, its steps, and a link that names it
    const sub = rows.filter({ hasText: "Subtraction by 2's complement" }).first();
    await expect(sub).toContainText("Step-by-step division");
    await expect(sub).toContainText("→");
    await expect(sub.getByRole("link", { name: /^Start · Subtraction by 2's complement/ })).toHaveAttribute("href", /\/binary-arithmetic\/subtraction-positive\/?$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
}
