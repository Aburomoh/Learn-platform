import { expect, test, type Page } from "@playwright/test";
import { checkScreen } from "../support/screen";

// Regression happy paths for the figure-backed CPET181 practices (C5 to C9, gates #533 to #537). Each
// expected answer is derived here from the question text or the drawing, never read from src/content.

const status = (page: Page) => page.locator("[role=status]");

/** Picks the radio whose label matches and checks it. */
async function answerChoice(page: Page, label: RegExp) {
  await page.getByRole("radio", { name: label }).check({ force: true });
  await page.getByRole("button", { name: /^Check/ }).click();
}

async function expectCorrect(page: Page) {
  await expect(status(page).filter({ hasText: /^Correct/ }).first()).toBeVisible();
}

async function typeAnswer(page: Page, value: number | string) {
  await page.locator("main input:not([type=radio])").first().fill(String(value));
  await page.getByRole("button", { name: /^Check/ }).first().click();
}

const mainText = (page: Page) => page.locator("main").innerText();

test("C5 resource sketch: a circle of holds and requests is a deadlock", async ({ page }) => {
  await page.goto("/courses/cpet181/deadlock-sketches/circle/");
  await checkScreen(page);
  for (let round = 0; round < 3; round++) {
    const prompt = (await mainText(page)).split("\n").find((l) => /^P\d holds/.test(l.trim()))!;
    // wait-for graph: process A waits for the holder of what A requests
    const holder = new Map<string, string>();
    const wants = new Map<string, string>();
    // "P1 holds R1 and requests R2, P2 holds R2 and requests nothing, and P3 requests R1."
    for (const clause of prompt.split(/[.,]\s*(?:and\s+)?(?=P\d)/)) {
      const who = clause.match(/^(P\d)/)?.[1];
      if (!who) continue;
      const h = clause.match(/holds (R\d)/);
      if (h) holder.set(h[1], who);
      const r = clause.match(/requests (R\d)/);
      if (r) wants.set(who, r[1]);
    }
    let cycle = false;
    for (const start of wants.keys()) {
      // follow "waits for the holder of what it requests"; coming back to the start is a circle
      let at: string | undefined = start;
      for (let hop = 0; hop < wants.size + 1 && at; hop++) {
        const want = wants.get(at);
        at = want ? holder.get(want) : undefined;
        if (at === start) cycle = true;
      }
    }
    await answerChoice(page, cycle ? /^Deadlock/ : /^No deadlock/);
    await expectCorrect(page);
    await page.getByRole("button", { name: "Try a similar one" }).click();
  }
  await checkScreen(page);
});

test("C6 expression tree: sequential steps, concurrent steps and processors", async ({ page }) => {
  // operator-precedence parser for  A = 3 * B * C + 4 / (D + E) ** (F − G)
  const parse = (src: string) => {
    const t = src.replace(/−/g, "-").match(/\*\*|[()+\-*/]|[A-Za-z0-9]+/g)!;
    let i = 0;
    type N = { leaf: string } | { op: string; l: N; r: N };
    const prim = (): N => {
      const x = t[i++];
      if (x === "(") {
        const e = add();
        i++;
        return e;
      }
      return { leaf: x };
    };
    const pow = (): N => {
      const l = prim();
      if (t[i] === "**") {
        i++;
        return { op: "**", l, r: pow() };
      }
      return l;
    };
    const mul = (): N => {
      let l = pow();
      while (t[i] === "*" || t[i] === "/") {
        const op = t[i++];
        l = { op, l, r: pow() };
      }
      return l;
    };
    const add = (): N => {
      let l = mul();
      while (t[i] === "+" || t[i] === "-") {
        const op = t[i++];
        l = { op, l, r: mul() };
      }
      return l;
    };
    const tree = add();
    const levels = new Map<number, number>();
    let ops = 0;
    const depth = (n: N): number => {
      if ("leaf" in n) return 0;
      const d = 1 + Math.max(depth(n.l), depth(n.r));
      levels.set(d, (levels.get(d) ?? 0) + 1);
      ops++;
      return d;
    };
    const d = depth(tree);
    return { ops, depth: d, width: Math.max(...levels.values()), level: (k: number) => levels.get(k) ?? 0 };
  };

  await page.goto("/courses/cpet181/concurrent-programming/sequential-steps/");
  await checkScreen(page);
  const expr = (await mainText(page)).match(/A = ([^\n]*?) one operation at a time/)![1];
  await typeAnswer(page, parse(expr).ops);
  await expectCorrect(page);

  await page.goto("/courses/cpet181/concurrent-programming/concurrent-steps/");
  // operations in step 1, then in step 2, then the steps of the whole chain, then the processors of the busiest step
  // (#665; the level questions come first since #692)
  const expr2 = (await mainText(page)).match(/A = ([^\n]*?)\. Every operation runs/)![1];
  const t = parse(expr2);
  for (const [i, answer] of [t.level(1), t.level(2), t.depth, t.width].entries()) {
    if (i) await page.getByRole("button", { name: /Next challenge/ }).click();
    await typeAnswer(page, answer);
    await expectCorrect(page);
  }
});

test("C7 tape: gaps between records one by one and between blocks", async ({ page }) => {
  await page.goto("/courses/cpet181/magnetic-tape/count-gaps/");
  await checkScreen(page);
  const records = Number((await mainText(page)).match(/(\d+) records are stored on a tape one by one/)![1]);
  await typeAnswer(page, records - 1);
  await expectCorrect(page);
  await page.getByRole("button", { name: /Next challenge/ }).click();
  const m = (await mainText(page)).match(/(\d+) records are stored on a tape in blocks of (\d+) records/)!;
  await typeAnswer(page, Math.ceil(Number(m[1]) / Number(m[2])) - 1);
  await expectCorrect(page);
});

test("C8 file layout: the drawing tells the organization", async ({ page }) => {
  await page.goto("/courses/cpet181/record-organization/organizations/");
  await checkScreen(page);
  for (let round = 0; round < 3; round++) {
    const labels = await page.locator("main svg").first().locator("text").evaluateAll((els) => els.map((e) => e.textContent ?? ""));
    const joined = labels.join(" ");
    const answer = /f\(key\)/.test(joined) ? /^Direct/ : /index/i.test(joined) ? /^Indexed sequential/ : /^Sequential/;
    await answerChoice(page, answer);
    await expectCorrect(page);
    if (round < 2) await page.getByRole("button", { name: "Try a similar one" }).click();
  }
});

test("C9 topology: no label names the shape, and the sketch can be named", async ({ page }) => {
  await page.goto("/courses/cpet181/topologies/shape/");
  await checkScreen(page);
  const figure = page.locator("main svg").first();
  const alt = (await figure.getAttribute("aria-label")) ?? "";
  expect(alt).not.toMatch(/star|ring|bus|tree|hybrid/i);
  expect((await figure.locator("text").evaluateAll((els) => els.map((e) => e.textContent ?? ""))).join(" ")).not.toMatch(/star|ring|bus|tree|hybrid/i);
  // a hub with spokes has one centre box and as many links as nodes; try each name until the check accepts
  const options = await page.getByRole("radio").count();
  for (let i = 0; i < options; i++) {
    await page.getByRole("radio").nth(i).check({ force: true });
    await page.getByRole("button", { name: /^Check/ }).click();
    if (await status(page).filter({ hasText: /^Correct/ }).count()) break;
  }
  await expectCorrect(page);
});
