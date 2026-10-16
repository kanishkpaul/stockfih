import { expect, test } from "@playwright/test";

test("the shipped worker analyzes the sample and exposes legal continuation evidence", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Analyze Game", exact: true }).click();
  await expect(page.getByRole("button", { name: "Analyze Game", exact: true })).toBeEnabled({ timeout: 60_000 });
  await expect(page.getByLabel("Game move or Stockfish continuation")).toBeVisible();
  await expect(page.getByLabel("Checked evidence")).toContainText("Stockfish candidate");
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(0);
});

test("replacing a game during analysis cannot publish the old game's results", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Analyze Game", exact: true }).click();
  await page.getByText("Import a game", { exact: true }).click();
  await page.getByLabel("Game PGN", { exact: true }).fill("1. d4 d5 2. c4 e6 *");
  await page.getByRole("button", { name: "Load Game", exact: true }).click();
  await expect(page.getByRole("button", { name: "Qxf7#", exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: "Analyze Game", exact: true }).click();
  await expect(page.getByRole("button", { name: "Analyze Game", exact: true })).toBeEnabled({ timeout: 60_000 });
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(0);
});
