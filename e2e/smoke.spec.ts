import { test, expect, type Page } from "@playwright/test";

/**
 * Core student flow (docs/MILESTONES.md):
 * open → choose course → open activity → one division step at a time → wrong step → feedback →
 * hint → Explain Slowly → retry on new numbers → finish the chain → read the bits → progress survives reload.
 * Runs at desktop and mobile viewports.
 */

const TOPIC = "/courses/ecet111/number-systems/";
const ACTIVITY = `${TOPIC}decimal-to-binary/`;

async function divisionStep(page: Page, dividend: number, quotient: number, remainder: number) {
  await page.getByLabel(`${dividend} divided by 2: result`).fill(String(quotient));
  await page.getByLabel(`${dividend} divided by 2: remainder`).fill(String(remainder));
  await page.getByRole("button", { name: "Check step" }).click();
}

test("home lists the course and navigates to an activity", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // home: one clear way in, and the demo notice as a quiet footer fact
  await expect(page.getByRole("heading", { level: 1, name: "Start here" })).toBeVisible();
  await expect(page.locator("[data-primary-action]")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toContainText("Demo content");
  // each hop waits for its URL so a slow transition fails at the hop, not on a stale page
  await page.getByRole("link", { name: /Introduction to Digital System Design/ }).click();
  await expect(page).toHaveURL(/\/courses\/ecet111\/$/);
  // course page: a chapter map; the topic title is a quiet link, and exactly one button is filled
  await expect(page.locator("[data-primary-action]")).toHaveCount(1);
  await page.getByRole("link", { name: "Number-base conversions", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${TOPIC}$`));
  // topic page: where am I, what am I learning, and one primary button
  await expect(page.getByRole("heading", { level: 1, name: "Number-base conversions" })).toBeVisible();
  await expect(page.getByText(/ECET 111 · Chapter 1/)).toBeVisible();
  await expect(page.locator("[data-primary-action]")).toHaveCount(1);
  await expect(page.getByRole("group").filter({ hasText: "What you'll practise" }).locator("ul")).toBeHidden();
  await page.locator("[data-primary-action]", { hasText: "Start practice" }).click();
  await expect(page).toHaveURL(new RegExp(`${ACTIVITY}$`));
  await expect(page.getByTestId("learning-stage")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("guest flow: walked division with feedback, hints, Explain Slowly, retry, read-off, saved progress", async ({ page }) => {
  const requests: string[] = [];
  await page.goto(ACTIVITY);
  const stage = page.getByTestId("learning-stage");
  await expect(stage).toBeVisible();
  page.on("request", (r) => requests.push(r.url()));

  // the chain length is not given away: only the first number is visible
  await expect(page.getByLabel("26 divided by 2: result")).toBeVisible();
  await expect(page.getByLabel("13 divided by 2: result")).toHaveCount(0);

  // 1. a correct step opens the next one and the tutor names it
  await divisionStep(page, 26, 13, 0);
  await expect(page.getByLabel("13 divided by 2: result")).toBeVisible();
  await expect(page.locator("[data-expression='encouraging']:visible")).toBeVisible();

  // 2. a wrong step: short feedback, no advance, tutor thinks
  await divisionStep(page, 13, 6, 0);
  await expect(page.getByRole("status").filter({ hasText: "Not correct yet." })).toBeVisible();
  await expect(stage).toHaveAttribute("data-stage", "await_retry");
  await expect(page.locator("[data-expression='thinking']:visible")).toBeVisible();
  await expect(page.getByLabel("13 divided by 2: result")).toBeVisible();

  // 3. hint ladder about this step
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(page.getByText("Nudge")).toBeVisible();
  await page.getByRole("button", { name: "Another hint" }).click();
  await expect(page.getByText("Concept")).toBeVisible();

  // 4. Explain Slowly with a prediction before the reveal
  await page.getByRole("button", { name: "Explain slowly" }).click();
  await expect(page.getByText("Step 1 of 7")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("[data-prediction]").getByText("What is the remainder of 26 ÷ 2?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  await page.locator("[data-prediction]").getByRole("button", { name: "0", exact: true }).click();
  await expect(page.locator("[data-prediction]").getByRole("status")).toContainText("26 ÷ 2 = 13");
  for (let i = 0; i < 10 && (await stage.getAttribute("data-stage")) === "explaining"; i++) {
    const pending = page.locator("[data-prediction] button:not([disabled])");
    if ((await pending.count()) > 0) await pending.first().click();
    await page.getByRole("button", { name: /Continue|Now I try/ }).click();
  }

  // 5. independent retry on new numbers (#42: never the explained ones), all the way to 0
  await expect(stage).toHaveAttribute("data-stage", "await_answer");
  await expect(page.getByText("Your turn now, with new numbers.")).toBeVisible();
  for (const [d, q, r] of [[37, 18, 1], [18, 9, 0], [9, 4, 1], [4, 2, 0], [2, 1, 0], [1, 0, 1]]) await divisionStep(page, d, q, r);
  await expect(page.getByRole("status").filter({ hasText: "Correct." })).toBeVisible();
  await expect(page.locator("[data-expression='pleased']:visible")).toBeVisible();

  // 6. read the remainders of the set just worked on (37, #141): LSB-first is recognised, MSB-first is right
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByText("Question 2 of 4")).toBeVisible();
  await expect(page.getByText("The division of 37 is finished", { exact: false })).toBeVisible();
  await page.getByRole("textbox").fill("101001");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Not correct yet." })).toBeVisible();
  await page.getByRole("textbox").fill("100101");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Correct." })).toBeVisible();

  // 7. only same-origin static assets were requested (no server or third-party calls)
  const origin = new URL(page.url()).origin;
  // static files of this site: Next.js assets and the brand mark (which a prefetched page may preload)
  const nonStatic = requests.filter((u) => !u.startsWith("data:") && !(u.startsWith(origin) && /\/_next\/|\/__next\.|\/brand\/[\w.-]+\.svg$/.test(u)));
  expect(nonStatic).toEqual([]);

  // 8. progress persisted locally and visible after navigation
  await page.waitForTimeout(1200); // debounced write
  const stored = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("cet-learn:v1:progress:")));
  expect(stored).toHaveLength(1);
  await page.goto(TOPIC);
  // the topic page now offers Continue for the practice in progress
  await expect(page.locator("[data-primary-action]")).toHaveText(/Continue/);
  await expect(page.locator("[data-action='continue']")).toBeVisible();
});

test("octal and hex by grouping, one goal at a time, finish the activity", async ({ page }) => {
  await page.goto(ACTIVITY);
  for (const [d, q, r] of [[26, 13, 0], [13, 6, 1], [6, 3, 0], [3, 1, 1], [1, 0, 1]]) await divisionStep(page, d, q, r);
  const correct = page.getByRole("status").filter({ hasText: "Correct." });

  // read the remainders: 11010
  await page.getByRole("button", { name: "Next question" }).click();
  await page.getByRole("textbox").fill("11010");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(correct).toBeVisible();

  // octal and hex: mark the groups first (padding on the left), then one digit per group
  for (const { size, zeros, cutAt, base, digits } of [
    { size: 3, zeros: 1, cutAt: "Bit 4 of 6", base: "octal", digits: [["011", "3"], ["010", "2"]] },
    { size: 4, zeros: 3, cutAt: "Bit 5 of 8", base: "hexadecimal", digits: [["0001", "1"], ["1010", "a"]] },
  ]) {
    await page.getByRole("button", { name: "Next question" }).click();
    await expect(page.getByRole("form", { name: `Mark groups of ${size} bits` })).toBeVisible();
    await expect(page.getByRole("textbox")).toHaveCount(0); // no digit is asked before the groups are right

    // a wrong grouping (no padding) stays on this goal
    await page.getByRole("button", { name: new RegExp(`Bit ${size === 3 ? 3 : 2} of 5: .*Start a new group here`) }).click();
    await page.getByRole("button", { name: "Check groups" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Not correct yet." })).toBeVisible();
    await page.getByRole("button", { name: new RegExp(`Bit ${size === 3 ? 3 : 2} of 5: .*Start a new group here`) }).click();

    for (let i = 0; i < zeros; i++) await page.getByRole("button", { name: "Add a leading zero" }).click();
    if (size === 4) {
      // 8 cells on the narrowest phone: the row scrolls inside its own box, the page does not widen
      const viewport = page.viewportSize()!;
      await page.setViewportSize({ width: 320, height: 700 });
      const widths = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        cells: document.querySelectorAll("button[aria-pressed]").length + 1,
      }));
      expect(widths.cells).toBe(8);
      expect(widths.page).toBeLessThanOrEqual(0);
      await page.setViewportSize(viewport);
    }
    await page.getByRole("button", { name: new RegExp(`${cutAt}: .*Start a new group here`) }).click();
    await page.getByRole("button", { name: "Check groups" }).click();

    for (const [i, [bits, digit]] of digits.entries()) {
      const input = page.getByLabel(`Group ${i + 1} of 2, ${bits}: ${base} digit`);
      await expect(input).toBeFocused();
      await expect(page.getByRole("textbox")).toHaveCount(1); // one goal at a time
      await input.fill(digit);
      await page.keyboard.press("Enter");
    }
    await expect(correct).toBeVisible();
  }
  await expect(page.locator("[data-focus-target='group-result']")).toContainText("(1A)16");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByTestId("activity-summary")).toBeVisible();
});

test("logic gates activity: walk the circuit gate by gate, then explore inputs", async ({ page }) => {
  await page.goto("/courses/ecet111/logic-gates/predict-gate-output/");
  await expect(page.getByRole("img", { name: /Circuit with NOT, AND, OR/ })).toBeVisible();
  const check = page.getByRole("button", { name: "Check" });
  const active = page.locator("[data-active]");

  // gate 1 (NOT): wrong answer keeps the student on this gate, with a nudge about it
  await expect(page.getByText("Gate 1 of 3: NOT")).toBeVisible();
  await expect(active).toHaveAttribute("data-focus-target", "gate-n1");
  await page.getByLabel("0", { exact: true }).check();
  await check.click();
  await expect(page.getByRole("status").filter({ hasText: "Not correct yet." })).toBeVisible();
  await expect(page.getByText("Gate 1 of 3: NOT")).toBeVisible();
  await page.getByLabel("1", { exact: true }).check();
  await check.click();

  // gate 2 (AND): the NOT gate stays lit with its value, focus moves to the new question
  await expect(page.getByText("Gate 2 of 3: AND")).toBeVisible();
  await expect(active).toHaveAttribute("data-focus-target", "gate-g1");
  await expect(page.locator("[data-focus-target='gate-n1'] text", { hasText: /^1$/ })).toBeVisible();
  await expect(page.locator("[data-focus-target='gate-g2'] text", { hasText: /^[01]$/ })).toHaveCount(0);
  await expect(page.getByLabel("0", { exact: true })).toBeFocused();
  await expect(active).toBeInViewport({ ratio: 0.9 });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  // gate 3 (OR) gives Y
  await expect(page.getByText("Gate 3 of 3: OR")).toBeVisible();
  await page.getByLabel(/Y = 1/).check();
  await check.click();
  await expect(page.getByRole("status").filter({ hasText: "Correct." })).toBeVisible();
  await expect(active).toHaveCount(0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  // explore mode: inputs become switches and Y updates live
  await expect(page.locator("svg text", { hasText: "Y = 1" })).toBeVisible();
  await page.getByRole("switch", { name: /Input C/ }).click();
  await page.getByRole("switch", { name: /Input A/ }).click();
  await expect(page.locator("svg text", { hasText: "Y = 0" })).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByText("Question 2 of 2")).toBeVisible();
});

for (const width of [390, 320]) {
  test(`circuit text stays at 12 px or more on a ${width} px phone, with the active gate in view`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/courses/ecet111/logic-gates/predict-gate-output/");
    await page.getByLabel("1", { exact: true }).check();
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByText("Gate 2 of 3: AND")).toBeVisible();
    await expect(page.locator("[data-active]")).toBeInViewport({ ratio: 1 });
    const report = await page.evaluate(() => {
      const box = document.querySelector("[data-diagram]")!;
      const svg = box.querySelector("svg")!;
      const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      const sizes = [...svg.querySelectorAll("text")].map((t) => parseFloat(getComputedStyle(t).fontSize) * scale);
      return {
        smallest: Math.min(...sizes),
        count: sizes.length,
        boxOverflow: box.scrollWidth - box.clientWidth,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(report.count).toBeGreaterThan(8);
    expect(report.smallest).toBeGreaterThanOrEqual(12);
    expect(report.pageOverflow).toBeLessThanOrEqual(0);
    // the whole circuit fits at 390 px; at 320 px it scrolls inside its own box
    if (width === 390) expect(report.boxOverflow).toBeLessThanOrEqual(0);
  });
}

test("Continue resumes at the first unfinished challenge; Review starts at challenge 1", async ({ page, request }) => {
  // the pre-rendered page holds no challenge, so nothing can flash before local progress is read
  const html = await (await request.get(ACTIVITY)).text();
  expect(html).not.toContain("Question 1 of");

  // finish challenges 1 and 2 of 4
  await page.goto(ACTIVITY);
  for (const [d, q, r] of [[26, 13, 0], [13, 6, 1], [6, 3, 0], [3, 1, 1], [1, 0, 1]]) await divisionStep(page, d, q, r);
  await page.getByRole("button", { name: "Next question" }).click();
  await page.getByRole("textbox").fill("11010");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Correct." })).toBeVisible();
  await page.waitForTimeout(1200); // debounced write

  // reload: challenge 3 (octal by grouping) is the first thing shown; challenge 1 never appears
  const seen: string[] = [];
  await page.exposeFunction("seenQuestion", (text: string) => seen.push(text));
  await page.addInitScript(() => {
    new MutationObserver(() => {
      const m = document.body?.innerText.match(/Question \d of \d/);
      if (m) (window as unknown as { seenQuestion: (t: string) => void }).seenQuestion(m[0]);
    }).observe(document, { childList: true, subtree: true });
  });
  await page.reload();
  await expect(page.getByText("Question 3 of 4")).toBeVisible();
  await expect(page.getByRole("form", { name: "Mark groups of 3 bits" })).toBeVisible();
  expect(new Set(seen)).toEqual(new Set(["Question 3 of 4"]));

  // Review restarts at challenge 1 without losing what was finished
  await page.goto(`${ACTIVITY}?review=1`);
  await expect(page.getByText("Question 1 of 4")).toBeVisible();
  await expect(page.getByLabel("26 divided by 2: result")).toBeVisible();
  await page.goto(ACTIVITY);
  await expect(page.getByText("Question 3 of 4")).toBeVisible();
});

// The pre-rendered HTML must match the first client render on every route (#100): a hydration
// mismatch makes React throw and re-render the whole page in the browser.
for (const route of [
  "/",
  "/courses/ecet111/",
  "/courses/ecet111/number-systems/",
  "/courses/ecet111/logic-gates/",
  "/courses/ecet111/number-systems/decimal-to-binary/",
  "/courses/ecet111/logic-gates/predict-gate-output/",
  "/settings/",
]) {
  test(`no page errors or hydration mismatch on ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
}

test("theme: light by default, dark or match-device only by choice, applied before first paint", async ({ page }) => {
  const theme = () => page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const LIGHT = "rgb(246, 243, 238)";
  const DARK = "rgb(28, 26, 23)";

  // a device that prefers dark still gets the light theme until the student chooses otherwise
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/settings/");
  expect(await theme()).toBe("light");
  expect(await background()).toBe(LIGHT);

  await page.getByLabel("Theme").selectOption("dark");
  await expect.poll(theme).toBe("dark");
  expect(await background()).toBe(DARK);
  await page.waitForTimeout(400); // debounced prefs write

  // the choice is applied by the head script on the next page, before React hydrates
  await page.goto("/courses/ecet111/logic-gates/predict-gate-output/");
  expect(await theme()).toBe("dark");
  expect(await background()).toBe(DARK);

  await page.goto("/settings/");
  await page.getByLabel("Theme").selectOption("system");
  await expect.poll(background).toBe(DARK);
  await page.emulateMedia({ colorScheme: "light" });
  await expect.poll(background).toBe(LIGHT);

  await page.getByRole("button", { name: "Clear my local data" }).click();
  await expect.poll(theme).toBe("light");
});

test("settings: clear local data resets progress", async ({ page }) => {
  await page.goto(ACTIVITY);
  await expect(page.getByTestId("learning-stage")).toBeVisible();
  await page.waitForTimeout(1200);
  await page.goto("/settings/");
  await page.getByRole("button", { name: "Clear my local data" }).click();
  await expect(page.getByRole("status")).toHaveText(/Cleared/);
  const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("cet-learn:v1:progress:")));
  expect(keys).toEqual([]);
});

test("reduced motion: no running animations, tutor text appears at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(ACTIVITY);
  await expect(page.getByTestId("learning-stage")).toBeVisible();
  const dur = () => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dur-base")));
  expect(await dur()).toBe(0);

  // a wrong step triggers tutor feedback, focus effects and the typing bubble
  await divisionStep(page, 26, 12, 0);
  await expect(page.getByRole("status").filter({ hasText: "Not correct yet." })).toBeVisible();
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(page.getByText("Nudge")).toBeVisible();
  const running = await page.evaluate(() =>
    document.getAnimations().filter((a) => a.playState === "running").map((a) => (a.effect as KeyframeEffect | null)?.target?.getAttribute("class") ?? "?"),
  );
  expect(running).toEqual([]);
  await expect(page.locator("[class*='caret']")).toHaveCount(0);

  // control: without the preference, motion tokens are non-zero
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(await dur()).toBeGreaterThan(0);
});

test("binary addition: rules, column by column with the end carry, then the decimal check (#38)", async ({ page }) => {
  await page.goto("/courses/ecet111/binary-arithmetic/binary-addition/");
  const correct = page.getByRole("status").filter({ hasText: "Correct." });
  const next = page.getByRole("button", { name: "Next question" });

  // the single-bit rules, one small check each
  for (const [i, answer] of ["0", "1", "10"].entries()) {
    if (i) await next.click();
    await page.getByLabel(answer, { exact: true }).check();
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await expect(correct).toBeVisible();
  }

  // 1101 + 0111, one column at a time; "wrote 2" keeps the student on the column with a nudge
  await next.click();
  const sum = page.getByLabel(/sum bit$/);
  const carry = page.getByLabel(/carry to the next column$/);
  const step = page.getByRole("button", { name: "Check step" });
  await sum.fill("2");
  await carry.fill("0");
  await step.click();
  await expect(page.getByText(/A column holds a single bit/)).toBeVisible();
  for (const [s, c] of [["0", "1"], ["0", "1"], ["1", "1"], ["0", "1"]]) {
    await sum.fill(s);
    await carry.fill(c);
    await step.click();
  }
  await page.getByLabel(/Final carry/).fill("1");
  await step.click();
  await expect(correct).toBeVisible();

  // check in decimal, one number at a time, ending with the match
  for (const value of ["13", "7", "20"]) {
    await next.click();
    await page.getByRole("textbox").fill(value);
    await page.getByRole("button", { name: "Check", exact: true }).click();
  }
  await expect(page.getByText("13 + 7 = 20")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
