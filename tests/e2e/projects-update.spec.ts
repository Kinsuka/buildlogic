import { expect, test } from "@playwright/test";
import { mockProjectsApi } from "./support/mockApi";

test("updates MO and material data, saves, and keeps values after refresh", async ({ page }) => {
  await mockProjectsApi(page);

  await page.goto("/");
  await page.getByTestId("open-projects-button").click();
  await page.getByTestId("project-item-Emeline").click();

  const moDays = page.getByTestId("mo-jours-lot-sdbmetier-plombiermo-depose");
  const moWorkers = page.getByTestId("mo-workers-lot-sdbmetier-plombiermo-depose");
  const moDep = page.getByTestId("mo-dep-lot-sdbmetier-plombiermo-depose");
  const matQty = page.getByTestId("mat-qty-lot-sdbmetier-plombiermat-carrelage");

  await moDays.fill("3");
  await moWorkers.selectOption("2");
  await moDep.fill("25");
  await matQty.fill("18");

  await page.getByTestId("save-project-button").click();

  await page.reload();
  await page.getByTestId("open-projects-button").click();
  await page.getByTestId("project-item-Emeline").click();

  await expect(page.getByTestId("mo-jours-lot-sdbmetier-plombiermo-depose")).toHaveValue("3");
  await expect(page.getByTestId("mo-workers-lot-sdbmetier-plombiermo-depose")).toHaveValue("2");
  await expect(page.getByTestId("mo-dep-lot-sdbmetier-plombiermo-depose")).toHaveValue("25");
  await expect(page.getByTestId("mat-qty-lot-sdbmetier-plombiermat-carrelage")).toHaveValue("18");
});
