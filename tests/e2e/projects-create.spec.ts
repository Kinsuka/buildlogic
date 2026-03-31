import { expect, test } from "@playwright/test";
import { mockProjectsApi } from "./support/mockApi";

test("creates a project with the manual flow", async ({ page }) => {
  await mockProjectsApi(page);

  await page.goto("/");
  await page.getByTestId("new-project-button").click();

  await page.getByText("Mode manuel").click();
  await page.getByTestId("manual-client-name-input").fill("Projet E2E");
  await page.getByTestId("manual-address-input").fill("Rue E2E 15, Bruxelles");
  await page.getByTestId("manual-validite-input").fill("45");
  await page.getByTestId("manual-create-project-button").click();

  await expect(page.getByTestId("project-builder")).toBeVisible();
  await expect(page.getByTestId("project-title")).toContainText("Projet E2E");
});
