import { expect, test } from "@playwright/test";

test("production PWA activates a service worker and opens offline after first load", async ({ context, page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });

  expect(context.serviceWorkers().length).toBeGreaterThan(0);

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Identity transformation, structured into quests." })).toBeVisible();
});
