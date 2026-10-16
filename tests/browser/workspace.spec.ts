import { expect, test } from "@playwright/test";

test("the shipped worker analyzes the sample and exposes legal continuation evidence", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Analyze Game", exact: true }).click();
  await expect(page.getByRole("button", { name: "Analyze Game", exact: true })).toBeEnabled({ timeout: 60_000 });
  await expect(page.getByLabel("Game move or Stockfish continuation")).toBeVisible();
  await expect(page.getByLabel("Checked evidence")).toContainText("Stockfish candidate");
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(0);
});

test("FEN exploration supports keyboard moves, undo, redo and promotion choice", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Import a game or position", { exact: true }).click();
  await page.getByLabel("Position FEN", { exact: true }).fill("7k/P7/6K1/8/8/8/8/8 w - - 0 1");
  await page.getByRole("button", { name: "Load position", exact: true }).click();
  await page.locator('[data-square="a7"]').click();
  await page.locator('[data-square="a8"]').click();
  await page.getByRole("button", { name: "Knight", exact: true }).click();
  await expect(page.getByTestId("displayed-fen")).toContainText("N6k");
  await page.getByRole("button", { name: "Previous move", exact: true }).click();
  await expect(page.getByTestId("displayed-fen")).toContainText("7k/P7");
  await page.getByRole("button", { name: "Next move", exact: true }).click();
  await expect(page.getByTestId("displayed-fen")).toContainText("N6k");
});

test("selecting a PV ply synchronizes its before-position with the board", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Analyze Game", exact: true }).click();
  await expect(page.getByRole("button", { name: "Analyze Game", exact: true })).toBeEnabled({ timeout: 60_000 });
  const select = page.getByLabel("Game move or Stockfish continuation");
  const labels = await select.locator("option").allTextContents();
  await select.selectOption({ label: labels.find(label => label.includes("ply 2:"))! });
  const before = await page.getByTestId("inspected-fen").textContent();
  await expect(page.getByTestId("displayed-fen")).toHaveText(before!);
  await page.getByRole("button", { name: "Show result", exact: true }).click();
  await expect(page.getByTestId("displayed-fen")).not.toHaveText(before!);
});

test("the workspace fits a phone and remains usable at 200 percent zoom", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("tab", { name: "Moves", exact: true }).click();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Explain", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Engine", exact: true }).click();
  await page.screenshot({ path: "output/playwright/workspace-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 768, height: 1024 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "output/playwright/workspace-desktop.png", fullPage: true });
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Analyze Game", exact: true })).toBeVisible();
});

test("replacing a game during analysis cannot publish the old game's results", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Analyze Game", exact: true }).click();
  await page.getByText("Import a game or position", { exact: true }).click();
  await page.getByLabel("Game PGN", { exact: true }).fill("1. d4 d5 2. c4 e6 *");
  await page.getByRole("button", { name: "Load Game", exact: true }).click();
  await expect(page.getByRole("button", { name: "Qxf7#", exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: "Analyze Game", exact: true }).click();
  await expect(page.getByRole("button", { name: "Analyze Game", exact: true })).toBeEnabled({ timeout: 60_000 });
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(0);
});

test("cancelled startup is visible and a new run can recover", async ({ page }) => {
  await page.route("**/stockfish/*.js", async route => {
    await new Promise(resolve => setTimeout(resolve, 250));
    await route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Analyze Game", exact: true }).click();
  await page.getByRole("button", { name: "Cancel analysis", exact: true }).click();
  await expect(page.getByRole("status", { name: "Analysis status", exact: true })).toContainText("cancelled");
  await page.getByRole("button", { name: "Analyze Game", exact: true }).click();
  await expect(page.getByRole("status", { name: "Analysis status", exact: true })).toContainText("Analysis complete", { timeout: 60_000 });
});

test("depth inspection, same-root comparison and trace export work with the shipped engine", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.getByLabel("Depth", { exact: true }).selectOption("8");
  await page.getByRole("button", { name: "Analyze position", exact: true }).click();
  await expect(page.getByRole("status", { name: "Analysis status", exact: true })).toContainText("complete");
  await page.getByText(/Search by depth ·/).click();
  await page.getByRole("button", { name: "4", exact: true }).click();
  await expect(page.getByText("Inspecting depth 4", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Compare selected move", exact: true }).click();
  await expect(page.getByLabel("Checked evidence")).toContainText("Restricting the root", { timeout: 30_000 });
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export trace", exact: true }).click();
  const download = await downloaded;
  const stream = await download.createReadStream(); const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const trace = JSON.parse(Buffer.concat(chunks).toString());
  expect(trace.schema).toBe("stockfih.search-trace.v1");
  expect(trace.comparison.restricted.provenance.rootMove).toBeTruthy();
  expect(trace.position.trace).toHaveLength(8);
});

test("critical move navigation reaches an analyzed outcome change", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Analyze Game", exact: true }).click();
  await expect(page.getByRole("status", { name: "Analysis status", exact: true })).toContainText("complete", { timeout: 60_000 });
  await expect(page.getByRole("button", { name: "Next critical move", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Next critical move", exact: true }).click();
  await expect(page.locator('[aria-current="step"]')).toHaveCount(1);
});

test("denied browser storage cannot prevent import or engine analysis", async ({ page }) => {
  await page.addInitScript(() => {
    for (const name of ["localStorage", "sessionStorage"]) Object.defineProperty(window, name, { get() { throw new DOMException("Denied", "SecurityError"); } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.getByRole("button", { name: "Analyze position", exact: true }).click();
  await expect(page.getByRole("status", { name: "Analysis status", exact: true })).toContainText("complete");
  await expect(page.getByLabel("Checked evidence")).toContainText("Stockfish candidate");
});

test("a phone comparison exposes cancellation beside its initiating control", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.route("**/stockfish/*.js", async route => { await new Promise(resolve => setTimeout(resolve, 500)); await route.continue(); });
  await page.goto("/");
  await page.getByRole("button", { name: "Next move", exact: true }).click();
  await page.getByRole("tab", { name: "Explain", exact: true }).click();
  await page.getByRole("button", { name: "Compare selected move", exact: true }).click();
  await expect(page.getByRole("status", { name: "Comparison status", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancel comparison", exact: true }).click();
  await expect(page.getByRole("button", { name: "Compare selected move", exact: true })).toBeEnabled();
});
