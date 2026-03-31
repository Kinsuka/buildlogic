import { expect, test } from "@playwright/test";
import { mockAssistantFlow, mockProjectsApi, mockTarifsApi } from "./support/mockApi";

test("opens Emeline without a blank page", async ({ page }) => {
  await mockProjectsApi(page);

  await page.goto("/");
  await page.getByTestId("open-projects-button").click();
  await page.getByTestId("project-item-Emeline").click();

  await expect(page.getByTestId("project-builder")).toBeVisible();
  await expect(page.getByTestId("project-title")).toContainText("Emeline");
  await expect(page.locator("body")).not.toBeEmpty();
});

test("runs the assistant flow with a mocked provider", async ({ page }) => {
  await mockProjectsApi(page);
  await mockTarifsApi(page);
  await mockAssistantFlow(page);

  await page.goto("/");
  await page.getByTestId("new-project-button").click();

  await page.getByTestId("provider-mistral").check();
  await page.getByTestId("assistant-api-key-input").fill("mock-key");
  await page.getByRole("button", { name: /Suivant/ }).click();

  await page.getByTestId("wizard-rapport-input").fill("Rapport test pour une renovation de salle de bain.");
  await page.getByRole("button", { name: /Analyser/ }).click();

  await expect(page.getByTestId("assistant-choice-0")).toBeVisible();
  await page.getByTestId("assistant-choice-0").click();
  await page.getByTestId("assistant-next-button").click();

  await expect(page.getByTestId("assistant-choice-0")).toBeVisible();
  await page.getByTestId("assistant-choice-0").click();
  await page.getByTestId("assistant-next-button").click();

  await expect(page.getByTestId("assistant-create-project-button")).toBeVisible();
  await page.getByTestId("assistant-create-project-button").click();

  await expect(page.getByTestId("project-builder")).toBeVisible();
  await expect(page.getByTestId("project-title")).toContainText("Projet Mock");
});
