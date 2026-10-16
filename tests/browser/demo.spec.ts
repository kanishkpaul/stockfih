import { expect, test } from "@playwright/test";

test.use({ video: "on", viewport: { width: 1440, height: 1000 } });
test("record the release walkthrough", async ({ page }) => {
  test.skip(!process.env.STOCKFIH_DEMO, "Opt-in portfolio recording.");
  await page.goto("/");
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Analyze Game", exact: true }).click();
  await expect(page.getByRole("status", { name: "Analysis status", exact: true })).toContainText("complete", { timeout: 60_000 });
  await page.getByText(/Search by depth ·/).click();
  await page.getByRole("button", { name: "6", exact: true }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "output/playwright/search-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Compare selected move", exact: true }).click();
  await expect(page.getByLabel("Checked evidence")).toContainText("Restricting the root");
  await page.getByRole("button", { name: "Show result", exact: true }).click();
  await page.waitForTimeout(1800);
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.locator('[data-square="g8"]').click();
  await page.locator('[data-square="f6"]').click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Previous move", exact: true }).click();
  await page.waitForTimeout(1000);
});
