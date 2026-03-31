import { expect, test } from "@playwright/test";
import { mockProjectsApi } from "./support/mockApi";

test("opens an existing project from the selector", async ({ page }) => {
  await mockProjectsApi(page);

  await page.goto("/");
  await page.getByTestId("open-projects-button").click();

  await expect(page.getByTestId("project-selector-modal")).toBeVisible();
  await page.getByTestId("project-item-Emeline").click();

  await expect(page.getByTestId("project-builder")).toBeVisible();
  await expect(page.getByTestId("project-title")).toContainText("Emeline");
  await expect(page.getByTestId("project-address")).toContainText("Rue des Tests 12");
});
