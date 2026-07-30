import { expect, test } from "@playwright/test";

test("opens the Life OS shell", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("The System: Life OS")).toBeVisible();
  await expect(page.getByRole("link", { name: "Begin Awakening" })).toBeVisible();
});
