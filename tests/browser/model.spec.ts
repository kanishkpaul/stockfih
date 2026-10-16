import { expect, test } from "@playwright/test";

async function configure(page: import("@playwright/test").Page, url: string, model: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Next move", exact: true }).click();
  await page.getByText("AI connection — BYOK or local", { exact: true }).click();
  await page.getByLabel("Base URL", { exact: true }).fill(url);
  await page.getByLabel("Model", { exact: true }).fill(model);
}

test("BYOK stays in tab memory and only checked provider facts are rendered", async ({ page }) => {
  await configure(page, "https://model.example/v1", "test-model");
  await page.getByLabel("API key", { exact: false }).fill("test-secret-not-real");
  let requests = 0;
  await page.route("https://model.example/v1/chat/completions", async route => {
    requests++;
    expect(route.request().headers().authorization).toBe("Bearer test-secret-not-real");
    expect(route.request().postData()).not.toContain("test-secret-not-real");
    await route.fulfill({ json: { choices: [{ message: { content: '{"facts":[0,1]}' } }] } });
  });
  await page.getByRole("button", { name: "Explain selected move", exact: true }).click();
  await expect(page.locator(".inspector-answer")).toContainText("White plays e4");
  expect(requests).toBe(1);
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]))).not.toContain("test-secret-not-real");
  await page.route("https://model.example/v1/chat/completions", route => route.fulfill({ json: { choices: [{ message: { content: '{"facts":[0,999]}' } }] } }));
  await page.getByRole("button", { name: "Explain selected move", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "evidence that does not exist" })).toBeVisible();
  await page.reload();
  await page.getByText("AI connection — BYOK or local", { exact: true }).click();
  await expect(page.getByLabel("API key", { exact: false })).toHaveValue("");
});

test("a real local model produces checked move explanations without a key", async ({ page }) => {
  test.skip(!process.env.STOCKFIH_LOCAL_URL, "Set STOCKFIH_LOCAL_URL and STOCKFIH_LOCAL_MODEL for opt-in live verification.");
  await configure(page, process.env.STOCKFIH_LOCAL_URL!, process.env.STOCKFIH_LOCAL_MODEL!);
  await page.getByRole("button", { name: "Explain selected move", exact: true }).click();
  await expect(page.locator(".inspector-answer")).toContainText("White plays e4", { timeout: 35_000 });
  await page.screenshot({ path: "output/playwright/local-model.png", fullPage: true });
});

test("an abandoned provider response cannot overwrite a newly selected move", async ({ page }) => {
  await configure(page, "https://model.example/v1", "test-model");
  await page.route("https://model.example/v1/chat/completions", async route => {
    await new Promise(resolve => setTimeout(resolve, 250));
    await route.fulfill({ json: { choices: [{ message: { content: '{"facts":[0,1]}' } }] } });
  });
  await page.getByRole("button", { name: "Explain selected move", exact: true }).click();
  await page.getByRole("button", { name: "Next move", exact: true }).click();
  await expect(page.locator(".inspector-answer")).toHaveCount(0);
  await page.getByRole("button", { name: "Explain selected move", exact: true }).click();
  await expect(page.locator(".inspector-answer")).toContainText("Black plays e5");
});
