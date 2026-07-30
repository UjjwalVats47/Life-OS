import { expect, test } from "@playwright/test";

test("shows explainable Hunter Log insights and manages derived snapshots", async ({ page }) => {
  await page.goto("/hunter-log", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Behavioral pattern analysis." })).toBeVisible();
  await expect(page.getByText("Current Experiment")).toBeVisible();
  await expect(page.getByText("Explainable insights")).toBeVisible();
  await expect(page.getByText(/confidence \| n=/i).first()).toBeVisible();
  await expect(page.getByText("Evidence").first()).toBeVisible();
  await expect(page.getByText("Alternative").first()).toBeVisible();
  await expect(page.getByText("Experiment").first()).toBeVisible();

  await page.getByRole("button", { name: "Rebuild insights" }).click();
  await expect(page.getByText(/derived insight snapshots rebuilt/i)).toBeVisible();

  await page.getByRole("button", { name: "Clear insights" }).click();
  await expect(page.getByText(/derived insight snapshots cleared/i)).toBeVisible();
});
