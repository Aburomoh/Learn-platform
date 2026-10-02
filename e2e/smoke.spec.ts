import { test, expect } from "@playwright/test";

test("home page renders and shows the demo notice", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("DEMO / NOT AUTHORITATIVE COURSE CONTENT")).toBeVisible();
});
