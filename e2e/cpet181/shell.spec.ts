import { test, expect } from "@playwright/test";
import { VIEWPORTS, checkScreen } from "../support/screen";

// CPET181 course shell (#540).
for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`CPET181 shell @ ${name}`, () => {
    test.use({ viewport });

    test("home lists two courses", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("link", { name: /Introduction to Digital System Design/ })).toBeVisible();
      await expect(page.locator('a[href*="/courses/cpet181"]').first()).toBeVisible();
      await checkScreen(page);
    });

    test("CPET181 map shows 9 chapters", async ({ page }) => {
      await page.goto("/courses/cpet181/");
      await expect(page.getByRole("heading", { level: 2, name: /^Chapter \d+: / })).toHaveCount(9);
      await checkScreen(page);
    });
  });
}
