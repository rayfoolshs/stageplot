import { test, expect } from "@playwright/test";

test("a new account can build a rider, autosave it, and reopen it", async ({ page }) => {
  const email = `e2e.${Date.now()}@example.com`;

  // --- register ------------------------------------------------------------
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("http://localhost:5173/");

  const saveToCloud = page.getByRole("button", { name: "Save to cloud" });
  await expect(saveToCloud).toBeVisible();

  // --- build a plot --------------------------------------------------------
  const stage = page.locator("[data-stage]");
  await expect(stage).toContainText("Drag items from the library");

  await page.locator('[draggable][title="Stage monitor"]').dragTo(stage, {
    targetPosition: { x: 300, y: 220 },
  });
  await expect(stage).toContainText("Monitor 1");

  // The monitor also lands in the desk's Monitors / outputs list.
  await expect(
    page.getByRole("table").last().locator("tbody input").first(),
  ).toHaveValue("Monitor 1");

  // --- cloud save ----------------------------------------------------------
  await saveToCloud.click();
  await page.waitForURL(/\/r\/[\w-]+$/);
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  // Editing autosaves; the badge settles back to Saved.
  await page.getByRole("button", { name: "Add a text label" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({ timeout: 20_000 });

  // --- it shows up in My riders -------------------------------------------
  await page.getByRole("link", { name: "My riders" }).click();
  await expect(page.getByRole("heading", { name: "Your riders" })).toBeVisible();

  const cards = page.locator("main li");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Untitled rider");
  await expect(cards.first().locator("img")).toHaveAttribute("src", /^data:image\/svg\+xml/);

  // Reopen it from the list and confirm the plot is intact.
  await cards.first().getByRole("link", { name: "Open", exact: true }).click();
  await page.waitForURL(/\/r\/[\w-]+$/);
  await expect(page.locator("[data-stage]")).toContainText("Monitor 1");
  await expect(page.locator("[data-stage]")).toContainText("Text");
});
