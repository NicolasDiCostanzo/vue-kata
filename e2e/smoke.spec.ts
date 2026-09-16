import { test, expect } from "@playwright/test";

// Smoke test: it only checks that the app boots, so it keeps passing no matter
// which version of the board you build.
//
// Add your own flows for the Game of Life UI in this folder (see
// VUE_GAME_OF_LIFE_KATA_PLAN.md, step 9) and give the elements you need to
// interact with a stable selector, e.g. `data-testid="start"`.
//
// Docs: https://playwright.dev/docs/intro
test("loads the app", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/game of life/i);
  await expect(page.locator("#app")).not.toBeEmpty();
});
