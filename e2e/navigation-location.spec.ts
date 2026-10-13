import { test, expect } from "@playwright/test";

// Epic #670 Phase 1, UI B (#674): where am I at every depth, and the way up from a course.

for (const [width, height] of [
  [390, 844],
  [1280, 800],
] as const) {
  test(`direct URL to a deep practice at ${width}: the location line and the practice title are on screen (#674, QW4)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/courses/ecet111/binary-arithmetic/subtraction-positive/");
    const nav = page.getByRole("navigation", { name: "You are here" });
    await expect(nav).toBeVisible();
    const title = page.getByRole("heading", { level: 1, name: "Subtraction by 2's complement" });
    await expect(title).toBeVisible();
    expect((await title.boundingBox())!.y).toBeLessThan(height);
    const topic = nav.getByRole("link", { name: "Binary arithmetic" });
    await expect(topic).toHaveAttribute("href", /\/courses\/ecet111\/binary-arithmetic\/?$/);
    const chapter = nav.getByRole("link", { name: "Chapter 1" });
    await expect(chapter).toHaveAttribute("href", /\/courses\/ecet111\/#chapter-chapter-1$/);
    const course = nav.getByRole("link", { name: "ECET 111" });
    if (width < 641) {
      // phones: the two nearest segments, the rest behind "…"
      await expect(topic).toBeVisible();
      await expect(chapter).toBeVisible();
      await expect(course).toBeHidden();
      await page.getByRole("button", { name: "Show the whole path" }).click();
      await expect(course).toBeVisible();
    } else {
      await expect(course).toBeVisible();
      await expect(page.getByRole("button", { name: "Show the whole path" })).toHaveCount(0);
    }
    // the first challenge still starts in the first screen
    expect((await page.getByText(/Challenge 1 of \d+/).first().boundingBox())!.y).toBeLessThan(height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test(`course page at ${width}: "← All courses" lands on Home's catalogue, first visit (#674, refinement 2)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/courses/ecet111/");
    const up = page.getByRole("link", { name: "All courses" });
    await expect(up).toHaveAttribute("href", "/#courses");
    await up.click();
    await expect(page).toHaveURL(/\/#courses$/);
    await expect(page.locator("#courses")).toBeInViewport();
  });

  test(`a #chapter link at ${width} opens that chapter on the course page (#674)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/courses/ecet111/#chapter-chapter-2");
    const details = page.locator("details#chapter-chapter-2");
    await expect(details).toHaveAttribute("open", "");
    await expect(details.getByRole("link", { name: "Basic gates", exact: true })).toBeVisible();
    // the chapter with the next step is still open too
    await expect(page.locator("details#chapter-chapter-1")).toHaveAttribute("open", "");
  });
}

test("topic page: the location line replaces the eyebrow; the course and chapter are links, the topic is the current place (#674)", async ({ page }) => {
  // at full width every segment shows (phones collapse the first one: the practice test above covers that)
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/courses/ecet111/binary-arithmetic/");
  const nav = page.getByRole("navigation", { name: "You are here" });
  await expect(nav).toHaveText(/ECET 111 · Chapter 1 · Binary arithmetic/);
  await expect(nav.getByRole("link", { name: "ECET 111" })).toHaveAttribute("href", /\/courses\/ecet111\/?$/);
  await expect(nav.getByRole("link", { name: "Chapter 1" })).toHaveAttribute("href", /#chapter-chapter-1$/);
  await expect(nav.getByText("Binary arithmetic")).toHaveAttribute("aria-current", "page");
  // the top bar's up link is unchanged: one level, the course
  await expect(page.getByRole("banner").getByRole("link", { name: "ECET 111" })).toHaveAttribute("href", /\/courses\/ecet111\/?$/);
});

test("/courses/ sends the browser on to Home's catalogue (#674, refinement 2)", async ({ page }) => {
  await page.goto("/courses/");
  await expect(page).toHaveURL(/\/#courses$/);
  await expect(page.locator("#courses")).toBeVisible();
});
