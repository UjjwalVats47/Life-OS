import { expect, test } from "@playwright/test";

test("awakens a local protocol and completes the first quest", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/awakening", { waitUntil: "domcontentloaded" });

  await page.getByLabel("System name").fill("Ujjwal");
  await page
    .getByLabel("Current state and recurring problems")
    .fill("I am inconsistent with focused study, career skills, sleep, and planned routines.");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByPlaceholder("Goal title").fill("Build dependable software engineering skills");
  await page.getByPlaceholder("Why this matters").fill("Create a strong career identity");
  await page.getByRole("button", { name: "Continue" }).click();

  await page
    .getByPlaceholder(/Comma-separated/)
    .fill("procrastination, irregular sleep, social avoidance");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /high intensity/i }).first().click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Activate System" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/protocol active/i)).toBeVisible();

  await page.goto("/goals");
  await expect(page.getByText("Action engine", { exact: true })).toBeVisible();
  await expect(page.getByText(/practice set with solutions/i).first()).toBeVisible();

  await page.getByRole("button", { name: /Edit Find and save one .*practice set with solutions/i }).click();
  await page.getByLabel("Action title").fill("Find and save one beginner coding set with ten solved questions");
  await page.getByRole("button", { name: "Save action" }).click();
  await expect(page.getByText(/preference will be reused/i)).toBeVisible();
  await expect(page.getByText("Find and save one beginner coding set with ten solved questions")).toBeVisible();

  const rejectableAction = page.getByTitle("Reject generated action").nth(1);
  await rejectableAction.click();
  const rejectionPanel = page.locator("article").filter({ has: page.getByLabel("Why is this unsuitable?") }).last();
  await rejectionPanel.getByLabel("Why is this unsuitable?").selectOption("too_long");
  await rejectionPanel.getByRole("button", { name: "Reject and adapt" }).click();
  await expect(page.getByText(/without treating it as execution failure/i)).toBeVisible();
  await expect(page.getByText(/feedback adjusted/i).first()).toBeVisible();

  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Open Quest Board" }).click();

  await expect(page.getByText("Option 1").first()).toBeVisible();
  await page.getByRole("button", { name: "Start", exact: true }).first().click();
  await page.getByRole("button", { name: "Yes, Start" }).click();
  await page.getByRole("button", { name: "Finish" }).click();
  await page
    .getByPlaceholder("What proves completion? Score, saved file, output, count, or result.")
    .fill("Saved the selected resource and recorded the required result.");
  await page.getByRole("button", { name: "Completed" }).click();
  await expect(page.getByText(/Quest complete:/)).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText(/Streak 1/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Streak 1/)).toBeVisible();

  await page.goto("/schedule");
  await page.getByRole("button", { name: "Run weekly review" }).click();
  await expect(page.getByText(/week|stress|completion/i).last()).toBeVisible();

  await page.goto("/goals");
  await expect(page.getByText(/Active identity/i)).toBeVisible();
  await expect(page.getByText(/current action cycle/i)).toBeVisible();

  await page.goto("/habits");
  await page.getByRole("button", { name: "Generate replacement" }).first().click();
  await expect(page.getByText(/Replacement habit is active/).first()).toBeVisible();

  await page.goto("/finance");
  await page.getByPlaceholder("0.00").fill("500");
  await page.getByRole("button", { name: "Add expense" }).click();
  await expect(page.getByText("Expense stored locally.")).toBeVisible();
  await expect(page.getByText(/₹500/).first()).toBeVisible();

  await page.goto("/events");
  await page.getByPlaceholder("Event title").fill("Semester physics exam");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Semester physics exam")).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).first().click();
  await expect(page.getByRole("button", { name: "Approved" }).first()).toBeDisabled();

  await page.goto("/hunter-log");
  await expect(page.getByText("Productivity Rhythm")).toBeVisible();
  await expect(page.getByText("Finance / Stress Link")).toBeVisible();
  await expect(page.locator("canvas").first()).toBeVisible();
});
