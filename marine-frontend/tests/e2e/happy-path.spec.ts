import { expect, test } from "@playwright/test";

test("quote → policy → cert preview → download", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Cargo type").fill("electronics");
  await page.getByLabel("Cargo value (USD)").fill("1000");
  await page.getByLabel("Origin").fill("Lagos");
  await page.getByLabel("Destination").fill("Rotterdam");

  await page.getByRole("button", { name: "Get quote" }).click();

  await expect(page).toHaveURL(/\/quotes\/[0-9a-f-]+/i);
  await expect(page.getByText(/Quote #/)).toBeVisible();

  await page.getByLabel("Customer name").fill("Acme Logistics");
  await page.getByRole("button", { name: "Issue policy" }).click();

  await expect(page.getByText(/Policy issued — POL-/)).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download certificate" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^certificate-POL-/);
});
