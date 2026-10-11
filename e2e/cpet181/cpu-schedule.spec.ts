import { expect, test, type Page } from "@playwright/test";
import { checkScreen } from "../support/screen";

// Regression happy path for the cpu-schedule kind (CPET181 C4, gate #532): attempt, feedback, hint, retry.
// The expected Gantt chart is simulated here from the jobs table on the screen (FCFS: earliest arrival
// first, table order on a tie), not read from src/content.

interface Job {
  id: string;
  arrival: number;
  cpu: number;
}

const status = (page: Page) => page.locator("[role=status]");

/** The jobs table is rendered as tab-separated rows "A\t0\t15". */
async function readJobs(page: Page): Promise<Job[]> {
  const text = await page.locator("main").innerText();
  const jobs: Job[] = [];
  for (const line of text.split("\n")) {
    const m = line.trim().match(/^([A-Z])\s+(\d+)\s+(\d+)$/);
    if (m) jobs.push({ id: m[1], arrival: Number(m[2]), cpu: Number(m[3]) });
  }
  return jobs;
}

function fcfs(jobs: Job[]) {
  const order = jobs.map((j, i) => ({ ...j, i })).sort((a, b) => a.arrival - b.arrival || a.i - b.i);
  const segments: { job: string | null; start: number; end: number }[] = [];
  const finish: Record<string, number> = {};
  let t = 0;
  for (const j of order) {
    if (j.arrival > t) {
      segments.push({ job: null, start: t, end: j.arrival });
      t = j.arrival;
    }
    segments.push({ job: j.id, start: t, end: t + j.cpu });
    t += j.cpu;
    finish[j.id] = t;
  }
  return { segments, finish };
}

test("cpu-schedule kind: attempt, feedback, hint, retry", async ({ page }) => {
  await page.goto("/courses/cpet181/fcfs-sjn/fcfs/");
  await expect(page.getByText(/Step 1 of \d+ · Segment 1/)).toBeVisible();
  await checkScreen(page);

  const jobs = await readJobs(page);
  expect(jobs.length, "jobs table is on the screen").toBeGreaterThanOrEqual(3);
  const { segments, finish } = fcfs(jobs);

  // Attempt: a job that is not next is a wrong answer with feedback; then a hint.
  const wrong = jobs.find((j) => j.id !== segments[0].job)!;
  await page.getByRole("radio", { name: new RegExp(`^${wrong.id}$`) }).check({ force: true });
  await page.getByRole("button", { name: /^Check job/ }).click();
  await expect(status(page).filter({ hasText: /Not (quite|correct)/ })).toBeVisible();
  const before = (await page.locator("main").innerText()).length;
  await page.getByRole("button", { name: "Hint" }).click();
  await expect.poll(async () => (await page.locator("main").innerText()).length).toBeGreaterThan(before);

  // Build the chart one segment at a time: which job, then until when.
  for (const s of segments) {
    await page.getByRole("radio", { name: s.job === null ? /idle/i : new RegExp(`^${s.job}$`) }).check({ force: true });
    await page.getByRole("button", { name: /^Check job/ }).click();
    await page.getByRole("textbox", { name: "Segment end time" }).fill(String(s.end));
    await page.getByRole("button", { name: /^Check/ }).first().click();
  }
  // Finish times, then turnaround (finish − arrival), then the average.
  for (const j of jobs) await page.getByLabel(`Finish time of ${j.id}`).fill(String(finish[j.id]));
  await page.getByRole("button", { name: /^Check/ }).click();
  for (const j of jobs) await page.getByLabel(`Turnaround of ${j.id}`).fill(String(finish[j.id] - j.arrival));
  await page.getByRole("button", { name: /^Check/ }).click();
  const avg = jobs.reduce((n, j) => n + finish[j.id] - j.arrival, 0) / jobs.length;
  await expect(page.getByText(/Step \d+ of \d+ · [^\n]*[Aa]verage/)).toBeVisible();
  await page.locator("main input:not([type=radio]):visible").last().fill(avg.toFixed(2));
  await page.getByRole("button", { name: /^Check/ }).click();
  await expect(status(page).filter({ hasText: /^Correct/ }).first()).toBeVisible();

  // Retry: a similar question has its own jobs.
  await page.getByRole("button", { name: "Try a similar one" }).click();
  await expect(page.getByText(/Step 1 of \d+ · Segment 1/)).toBeVisible();
  await checkScreen(page);
});
