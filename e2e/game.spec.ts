import { expect, test } from "@playwright/test";

// Full user flows for the Game of Life UI. Liveness is always asserted
// through `data-testid` + `data-alive` (never class names or colours), and
// evolution is observed with retrying assertions (`expect.poll`), never
// fixed timeouts — with one deliberate exception: proving the board is
// *frozen* while paused needs wall-clock time to pass (there is no new state
// to poll for), so that single spot uses `waitForTimeout`. A blinker
// (3 cells, survives) is drawn wherever the test needs to watch the board
// change — a single cell would die immediately.

test("loads with an empty board and a disabled Start button", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/game of life/i);
  const board = page.getByTestId("board");
  await expect(board).toBeVisible();
  // The whole 100x100 grid is rendered: the four corners are enough proof.
  for (const id of ["cell-0-0", "cell-0-99", "cell-99-0", "cell-99-99"]) {
    await expect(page.getByTestId(id)).toHaveAttribute("data-alive", "false");
  }
  await expect(page.getByTestId("start")).toBeDisabled();
  await expect(page.getByTestId("pause")).toBeDisabled();
  await expect(page.getByTestId("status")).toHaveText("paused");
});

test("clicking a cell toggles it alive, clicking again makes it dead", async ({
  page,
}) => {
  await page.goto("/");

  const cell = page.getByTestId("cell-3-7");
  await expect(cell).toHaveAttribute("data-alive", "false");
  await cell.click();
  await expect(cell).toHaveAttribute("data-alive", "true");
  // Non-empty board: Start becomes enabled.
  await expect(page.getByTestId("start")).toBeEnabled();
  await cell.click();
  await expect(cell).toHaveAttribute("data-alive", "false");
});

test("Start runs the loop, Pause stops it, Reset clears and pauses", async ({
  page,
}) => {
  await page.goto("/");

  // Draw a vertical blinker at column 10, rows 9-11.
  await page.getByTestId("cell-9-10").click();
  await page.getByTestId("cell-10-10").click();
  await page.getByTestId("cell-11-10").click();

  const start = page.getByTestId("start");
  const pause = page.getByTestId("pause");
  const reset = page.getByTestId("reset");

  await start.click();
  await expect(start).toBeDisabled();
  await expect(pause).toBeEnabled();
  await expect(page.getByTestId("status")).toHaveText("running");

  // One generation flips the vertical blinker to horizontal. All five
  // neighbourhood cells are read in ONE `evaluate` round-trip (scoped to
  // the board, keyed by id), so the snapshot can't tear: five separate
  // `getAttribute` calls — or one `evaluateAll` over a multi-element
  // locator, whose document order isn't guaranteed to match the id list —
  // could observe a half-old/half-new or mis-ordered board. Poll until the
  // full horizontal pattern appears — deaths AND births together.
  const BLINKER_IDS = [
    "cell-9-10",
    "cell-10-10",
    "cell-11-10",
    "cell-10-9",
    "cell-10-11",
  ];
  const snapshot = (): Promise<Record<string, string | null>> =>
    page
      .getByTestId("board")
      .evaluate(
        (board, ids) =>
          Object.fromEntries(
            ids.map((id) => [
              id,
              board
                .querySelector(`[data-testid="${id}"]`)
                ?.getAttribute("data-alive") ?? null,
            ]),
          ),
        BLINKER_IDS,
      );
  await expect.poll(snapshot).toEqual({
    "cell-9-10": "false",
    "cell-10-10": "true",
    "cell-11-10": "false",
    "cell-10-9": "true",
    "cell-10-11": "true",
  });

  await pause.click();
  await expect(page.getByTestId("status")).toHaveText("paused");
  await expect(start).toBeEnabled();
  await expect(pause).toBeDisabled();

  // Frozen while paused: reuse the same atomic snapshot, let a few
  // generations' worth of time pass, and require zero change. Sampling
  // actual cell states (instead of asserting one phase) keeps the test
  // deterministic: right after `expect.poll` + `pause.click()`, a tick may
  // slip in and flip the blinker back to vertical, so any absolute
  // `data-alive` expectation here races the loop and flakes (~200ms tick
  // vs. click latency).
  const frozen = await snapshot();
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(800);
  await expect.poll(snapshot).toEqual(frozen);

  await reset.click();
  await expect(page.getByTestId("status")).toHaveText("paused");
  for (const id of ["cell-9-10", "cell-10-10", "cell-11-10", "cell-10-9"]) {
    await expect(page.getByTestId(id)).toHaveAttribute("data-alive", "false");
  }
  // Empty board again: the Start guard is directly observable here.
  await expect(start).toBeDisabled();
  await expect(pause).toBeDisabled();
});
