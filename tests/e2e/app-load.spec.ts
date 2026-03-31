import { expect, test } from "@playwright/test";
import { mockProjectsApi } from "./support/mockApi";

test("loads the app home screen", async ({ page }) => {
  await mockProjectsApi(page);

  await page.goto("/");

  await expect(page.getByTestId("app-home")).toBeVisible();
  await expect(page.getByTestId("open-projects-button")).toBeVisible();
  await expect(page.getByTestId("new-project-button")).toBeVisible();
});
