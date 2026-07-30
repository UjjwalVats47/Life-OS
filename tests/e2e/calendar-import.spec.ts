import { expect, test } from "@playwright/test";

test("previews and approves local calendar import", async ({ page }) => {
  await page.goto("/events", { waitUntil: "domcontentloaded" });

  await page.getByPlaceholder("Paste .ics calendar text").fill(`BEGIN:VCALENDAR
BEGIN:VEVENT
UID:calendar-import-1
SUMMARY:Scholarship submission deadline
DTSTART:20260815T180000
DTEND:20260815T190000
DESCRIPTION:Submit final documents
END:VEVENT
END:VCALENDAR`);

  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByText("Scholarship submission deadline", { exact: true })).toBeVisible();
  await expect(page.getByText("clear")).toBeVisible();

  await page.getByRole("button", { name: "Import selected" }).click();
  await expect(page.getByText("Calendar items imported as Life OS events.")).toBeVisible();
  await expect(page.getByText("Scholarship submission deadline")).toBeVisible();
});
