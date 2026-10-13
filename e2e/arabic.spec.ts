import { test, expect, type Page } from "@playwright/test";

/**
 * Arabic supportive text (ADR-0011, #650): the `EN | عربي` control switches the tutor's lines at
 * once and site-wide, the choice survives navigation and reload, Arabic prose is RTL with English
 * runs isolated, the English question stays LTR, nothing mirrors and nothing overflows.
 */

const ACTIVITY = "/courses/ecet111/number-systems/decimal-to-binary/";

const rtlElements = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[dir='rtl']")].map((el) => ({
      tag: el.tagName,
      lang: el.getAttribute("lang"),
      layoutChildren: [...el.children].filter((c) => c.tagName !== "BDI" && c.tagName !== "SPAN" && c.tagName !== "SUB" && c.tagName !== "SUP").length,
    })),
  );

test("عربي at 390: a topic page of eight practices and Home never overflow sideways (QA on #714)", async ({ page }) => {
  // the build has no Arabic for the chrome yet: the test serves a stub map with the lines that matter
  const stub = { "Practices: {titles}": "التمارين: {titles}", "{n} chapters": "الفصول: {n}", "{n} topics": "المواضيع: {n}", "{n} started": "جارٍ: {n}", "Start · {title}": "ابدأ · {title}" };
  await page.route("**/l10n/ar/index.json", (route) => route.fulfill({ json: { shared: "shared.test.json" } }));
  await page.route("**/l10n/ar/shared.test.json", (route) => route.fulfill({ json: stub }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("group", { name: /Language|اللغة/ }).getByRole("button", { name: "عربي" }).click();
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await expect(page.locator("#courses")).toContainText("الفصول:");
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.goto("/courses/ecet111/binary-arithmetic/");
  await expect(page.locator("h1")).toContainText("Binary arithmetic");
  await expect(page.locator("main")).toContainText("التمارين:");
  expect(await overflow()).toBeLessThanOrEqual(0);
  // the list is not a nowrap pair: it wraps over several lines
  const line = page.locator("main").getByText(/التمارين:/).first();
  const box = (await line.boundingBox())!;
  expect(box.width).toBeLessThanOrEqual(390);
  expect(box.height).toBeGreaterThan(40);
});

test("EN | عربي: applies at once, persists across pages and a reload, Arabic is RTL text only", async ({ page }) => {
  await page.goto("/");
  const group = page.getByRole("group", { name: "Language" });
  await expect(group.getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "true");
  await group.getByRole("button", { name: "عربي" }).click();
  await expect(group.getByRole("button", { name: "عربي" })).toHaveAttribute("aria-pressed", "true");
  // the home tutor line (where the width shows it) is now Arabic on a text element; the page itself stays LTR
  const homeLine = page.getByRole("complementary", { name: "Tutor" }).locator("[dir='rtl'][lang='ar']");
  if (await homeLine.count()) await expect(homeLine.first()).toHaveText(/[؀-ۿ]/);
  await expect(page.locator("html")).not.toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("banner")).not.toHaveAttribute("dir", "rtl");

  // persists: a direct entry into an activity and a reload keep Arabic
  await page.goto(ACTIVITY);
  await expect(page.getByRole("group", { name: "Language" }).getByRole("button", { name: "عربي" })).toHaveAttribute("aria-pressed", "true");
  const bubble = page.locator("[data-tutor-text]");
  await expect(bubble).toHaveAttribute("dir", "rtl");
  await expect(bubble).toHaveAttribute("lang", "ar");
  await page.reload();
  await expect(page.locator("[data-tutor-text]")).toHaveAttribute("lang", "ar");

  // the question stays English and LTR; the English numbers in the Arabic bubble are isolated runs
  const question = page.getByRole("region", { name: "Question" });
  await expect(question).not.toHaveAttribute("dir", "rtl");
  await expect(question.locator("[dir='rtl']")).toHaveCount(0);
  expect(await question.getByLabel(/divided by 2: result/).first().isVisible()).toBe(true);

  // a wrong step: the Arabic feedback and, after a hint, an Arabic hint with the bit string in <bdi dir=ltr>
  await page.getByLabel(/divided by 2: result/).first().fill("1");
  await page.getByLabel(/divided by 2: remainder/).first().fill("1");
  await page.getByRole("button", { name: "Check step" }).click();
  await expect(page.getByRole("status").filter({ hasText: /[؀-ۿ]/ }).first()).toBeVisible();
  await page.getByRole("button", { name: "Hint" }).click();
  const hints = page.getByRole("region", { name: "Hints" });
  await expect(hints.locator("[dir='rtl'][lang='ar']").first()).toBeVisible();
  // every rtl element on the page is a text span holding only text and isolated runs: no mirrored layout
  for (const el of await rtlElements(page)) {
    expect(el.tag).toBe("SPAN");
    expect(el.lang).toBe("ar");
    expect(el.layoutChildren).toBe(0);
  }
  // no horizontal overflow with Arabic on, at this viewport
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

  // back to English at once, from the same control, and it sticks
  await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "EN" }).click();
  await expect(page.locator("[data-tutor-text]")).not.toHaveAttribute("dir", "rtl");
  await page.reload();
  await expect(page.getByRole("group", { name: "Language" }).getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "true");
});

test("the Arabic maps are static files: the index names content-hashed maps and the English bundle does not load them", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/l10n/")) requests.push(new URL(r.url()).pathname);
  });
  await page.goto(ACTIVITY);
  await page.waitForLoadState("networkidle");
  expect(requests).toEqual([]);
  await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "عربي" }).click();
  await expect(page.locator("[data-tutor-text]")).toHaveAttribute("lang", "ar");
  expect(requests[0]).toBe("/l10n/ar/index.json");
  expect(requests.slice(1).sort()).toEqual(expect.arrayContaining([expect.stringMatching(/^\/l10n\/ar\/shared\.[0-9a-f]{10}\.json$/), expect.stringMatching(/^\/l10n\/ar\/ecet111\.[0-9a-f]{10}\.json$/)]));
  expect(requests).toHaveLength(3);
});
