import { expect, test } from "@playwright/test";

test("the shipped worker analyzes the sample and exposes legal continuation evidence", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Analyze Game", exact: true }).click();
  await expect(page.getByRole("button", { name: "Analyze Game", exact: true })).toBeEnabled({ timeout: 60_000 });
  await expect(page.getByLabel("Game move or Stockfish continuation")).toBeVisible();
  await expect(page.getByLabel("Checked evidence")).toContainText("Stockfish candidate");
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(0);
});
