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
  await expect(page.getByText("Recommande : Salle de bain")).toBeVisible();
  await page.getByTestId("assistant-choice-0").click();
  await page.getByTestId("assistant-next-button").click();

  await expect(page.getByTestId("assistant-choice-0")).toBeVisible();
  await page.getByTestId("assistant-unknown-option").click();
  await page.getByTestId("assistant-back-button").click();
  await page.getByTestId("assistant-choice-0").click();
  await page.getByTestId("assistant-next-button").click();

  await expect(page.getByTestId("assistant-create-project-button")).toBeVisible();
  await page.getByTestId("assistant-create-project-button").click();

  await expect(page.getByTestId("project-builder")).toBeVisible();
  await expect(page.getByTestId("project-title")).toContainText("Projet Mock");
  await expect(page.getByText(/payload canonique est pret/i)).toHaveCount(0);
});

test("creates a project from the canonical payload without calling the SQL edge", async ({ page }) => {
  const consoleEvents: string[] = [];
  page.on("console", (msg) => {
    consoleEvents.push(msg.text());
  });

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
  await page.getByTestId("assistant-choice-0").click();
  await page.getByTestId("assistant-next-button").click();
  await page.getByTestId("assistant-choice-0").click();
  await page.getByTestId("assistant-next-button").click();

  await expect(page.getByTestId("assistant-create-project-button")).toBeVisible();
  const debugBeforeCreate = await page.evaluate(() => window.__ONA_AI_DEBUG__ || []);
  expect(debugBeforeCreate.some((entry: any) => entry.event === "assistant_final_output_detected" && entry.outputFormat === "canonical_payload")).toBe(true);
  expect(debugBeforeCreate.some((entry: any) => entry.event === "assistant_preview_ready" && entry.outputFormat === "canonical_payload")).toBe(true);
  expect(debugBeforeCreate.some((entry: any) => entry.event === "assistant_edge_call_started")).toBe(false);

  await page.getByTestId("assistant-create-project-button").click();
  await expect(page.getByTestId("project-builder")).toBeVisible();

  const debugAfterCreate = await page.evaluate(() => window.__ONA_AI_DEBUG__ || []);
  expect(debugAfterCreate.some((entry: any) => entry.event === "assistant_create_button_clicked")).toBe(true);
  expect(debugAfterCreate.some((entry: any) => entry.event === "assistant_canonical_create_started")).toBe(true);
  expect(debugAfterCreate.some((entry: any) => entry.event === "assistant_canonical_create_succeeded")).toBe(true);
  expect(debugAfterCreate.some((entry: any) => entry.event === "assistant_edge_call_started")).toBe(false);
  expect(consoleEvents.some((line) => line.includes("[ONA_AI_FINAL] assistant_final_output_detected"))).toBe(true);
});

test("logs missing final output when assistant keeps asking questions", async ({ page }) => {
  await mockProjectsApi(page);
  await mockTarifsApi(page);
  await mockAssistantFlow(page, { finalReplyMode: "question" });

  await page.goto("/");
  await page.getByTestId("new-project-button").click();
  await page.getByTestId("provider-mistral").check();
  await page.getByTestId("assistant-api-key-input").fill("mock-key");
  await page.getByRole("button", { name: /Suivant/ }).click();
  await page.getByTestId("wizard-rapport-input").fill("Rapport test pour une renovation de salle de bain.");
  await page.getByRole("button", { name: /Analyser/ }).click();
  await page.getByTestId("assistant-choice-0").click();
  await page.getByTestId("assistant-next-button").click();
  await page.getByTestId("assistant-choice-0").click();
  await page.getByTestId("assistant-next-button").click();

  const debugEntries = await page.evaluate(() => window.__ONA_AI_DEBUG__ || []);
  const missingOutputEntries = debugEntries.filter((entry: any) => entry.event === "assistant_final_output_missing");

  expect(missingOutputEntries.length).toBeGreaterThan(0);
  expect(await page.getByTestId("assistant-create-project-button").count()).toBe(0);
});

test("keeps the SQL fallback path when assistant still returns legacy SQL", async ({ page }) => {
  const consoleEvents: string[] = [];
  page.on("console", (msg) => {
    consoleEvents.push(msg.text());
  });

  await mockProjectsApi(page);
  await mockTarifsApi(page);
  await mockAssistantFlow(page, { finalReplyMode: "sql" });

  await page.goto("/");
  await page.getByTestId("new-project-button").click();
  await page.getByTestId("provider-mistral").check();
  await page.getByTestId("assistant-api-key-input").fill("mock-key");
  await page.getByRole("button", { name: /Suivant/ }).click();
  await page.getByTestId("wizard-rapport-input").fill("Rapport test pour une renovation de salle de bain.");
  await page.getByRole("button", { name: /Analyser/ }).click();
  await page.getByTestId("assistant-choice-0").click();
  await page.getByTestId("assistant-next-button").click();
  await page.getByTestId("assistant-choice-0").click();
  await page.getByTestId("assistant-next-button").click();
  await expect(page.getByTestId("assistant-create-project-button")).toBeVisible();

  const debugBeforeCreate = await page.evaluate(() => window.__ONA_AI_DEBUG__ || []);
  expect(debugBeforeCreate.some((entry: any) => entry.event === "assistant_final_sql_detected")).toBe(true);
  expect(debugBeforeCreate.some((entry: any) => entry.event === "assistant_preview_ready" && entry.outputFormat === "sql")).toBe(true);

  await page.getByTestId("assistant-create-project-button").click();

  const debugAfterCreate = await page.evaluate(() => window.__ONA_AI_DEBUG__ || []);
  expect(debugAfterCreate.some((entry: any) => entry.event === "assistant_edge_call_started")).toBe(true);
  expect(debugAfterCreate.some((entry: any) => entry.event === "assistant_edge_response_received")).toBe(true);
  expect(consoleEvents.some((line) => line.includes("[ONA_AI_FINAL] assistant_final_sql_detected"))).toBe(true);
});

test("logs edge response error when SQL fallback cannot be executed", async ({ page }) => {
  await mockProjectsApi(page);
  await mockTarifsApi(page);
  await mockAssistantFlow(page, { finalReplyMode: "sql", edgeMode: "error" });

  await page.goto("/");
  await page.getByTestId("new-project-button").click();
  await page.getByTestId("provider-mistral").check();
  await page.getByTestId("assistant-api-key-input").fill("mock-key");
  await page.getByRole("button", { name: /Suivant/ }).click();
  await page.getByTestId("wizard-rapport-input").fill("Rapport test pour une renovation de salle de bain.");
  await page.getByRole("button", { name: /Analyser/ }).click();
  await page.getByTestId("assistant-choice-0").click();
  await page.getByTestId("assistant-next-button").click();
  await page.getByTestId("assistant-choice-0").click();
  await page.getByTestId("assistant-next-button").click();
  await page.getByTestId("assistant-create-project-button").click();

  const debugEntries = await page.evaluate(() => window.__ONA_AI_DEBUG__ || []);
  const errorEntries = debugEntries.filter((entry: any) => entry.event === "assistant_edge_response_error");

  expect(errorEntries.length).toBeGreaterThan(0);
  expect(errorEntries.some((entry: any) => entry.edgeError === "mock edge failure")).toBe(true);
  await expect(page.getByText(/mock edge failure/i)).toBeVisible();
});
