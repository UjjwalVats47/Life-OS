import { expect, test } from "@playwright/test";

test("opens Milestone 8 controls and uses the local System chat", async ({ page }) => {
  await page.goto("/settings", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "PWA Status" })).toBeVisible();
  await expect(page.getByText("External AI", { exact: true })).toBeVisible();
  await expect(page.getByText("rule based")).toBeVisible();
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await expect(page.getByText("Service worker support")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export backup" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Import backup" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Rebuild work model" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open reminders" })).toBeVisible();

  await page.goto("/system-chat", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Rule-based command channel.")).toBeVisible();
  await page.getByPlaceholder("Tell the System what you are deciding...").fill("I want to skip my schedule and do it later");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(/Name the real reason first/)).toBeVisible();
});
