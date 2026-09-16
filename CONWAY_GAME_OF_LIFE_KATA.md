# Conway's Game of Life Kata

## Core rules

For each cell, look at its eight neighboring cells:

- A live cell with 2 live neighbors stays alive.
- A live cell with 3 live neighbors stays alive.
- A live cell with fewer than 2 live neighbors dies from underpopulation.
- A live cell with more than 3 live neighbors dies from overpopulation.
- A dead cell with exactly 3 live neighbors becomes alive through reproduction.
- A dead cell with anything other than 3 live neighbors remains dead.

These updates happen simultaneously for the whole board. In other words, the next generation is computed from the current generation, not from cells that were already updated earlier in the same step.

## Board

- The board is a fixed-size grid of **100 rows × 100 columns**.
- The board uses **wrapping (toroidal) boundaries**. The grid is treated as if it loops around on itself, so the cells on the right edge are neighbors of the cells on the left edge, and the cells on the bottom edge are neighbors of the cells on the top edge. A pattern that moves off one edge reappears on the opposite edge.

## User interaction

- The board starts **empty** (every cell dead) and the simulation starts **paused**, so the user can start it whenever they want.
- The user places cells by **clicking on them**. Clicking a cell **toggles** it between alive and dead.
- Cells can be toggled **at any time**, including while the simulation is running. Toggling
  a cell never stops, restarts or speeds up the loop: the next generation is always
  computed from the board as it is at that moment.
- There is **no step button** — generations only advance through the automatic simulation loop.
- There is **no end condition**: if every cell dies while the simulation is running, the board simply stays empty and the loop keeps running until the user pauses, resets or draws new cells. (The Start button being disabled on an empty board only guards *starting*: it never stops a loop that is already running.)

## Controls

- **Start:** begins the automatic simulation loop. The Start button is **disabled while the simulation is running** and **disabled when the board is empty**.
- **Pause:** stops the simulation loop. The Pause button is **disabled while the simulation is paused**.
- **Reset:** clears the board to all dead cells **and pauses** the simulation.

There are **no pattern presets** in the UI — the user draws every pattern by hand.

| Control | Enabled when | Disabled when |
| --- | --- | --- |
| **Start** | the board has at least one live cell **and** the simulation is paused | the simulation is already running, or the board is empty |
| **Pause** | the simulation is running | the simulation is paused |
| **Reset** | always | never |

## Expected behavior

The simulation should:

- start from the state the user has drawn,
- calculate the next generation according to the rules above,
- advance automatically over time while running,
- allow the user to observe how patterns evolve.

The interval between generations is **not configurable**. Pick any value you find comfortable to watch; it is not part of the acceptance criteria.

## Typical patterns

Some well-known patterns are useful to test your implementation. They are used as test fixtures, not exposed in the UI:

- Oscillators (the "blinker"): patterns that alternate between states and repeat.

  Example:

  ```text
  -*-
  -*-
  -*-
  ```

  This 3-cell blinker flips between a vertical and a horizontal line.

- Still lifes (the "block"): patterns that do not change from one generation to the next.

  Example:

  ```text
  **
  **
  ```

  This block remains stable forever.

- Gliders: patterns that move across the board.

  Example:

  ```text
  -*-
  --*
  ***
  ```

  This pattern moves diagonally across the grid from one generation to the next. On a wrapping board, it keeps travelling forever.

## Suggested kata constraints

- represent the board as a 2D grid,
- keep the rules isolated and easy to test (a pure function is the easiest thing to test),
- keep the rules independent of the 100 × 100 size — derive the rows and columns from the
  board — so they can be tested on small boards (3 × 3, 5 × 5) instead of 10,000 cells,
- stop the timer when pausing and when the component unmounts,
- write tests for edge cases such as:
  - a live cell with 0 neighbors (dies from underpopulation),
  - a live cell with 2 neighbors (stays alive),
  - a live cell with 3 neighbors (stays alive),
  - a live cell with 4 neighbors (dies from overpopulation),
  - a dead cell with exactly 3 neighbors (becomes alive),
  - a dead cell with 2 or 4 neighbors (stays dead),
  - a live cell in a corner or on an edge, to prove the wrapping boundaries work,
  - a board with all cells dead (it stays empty).

## Testing expectations

The behavior should be covered at two levels.

**Unit / component tests (Vitest):**

- the rules are tested against small, hand-written boards — including the edge cases above,
  the three classic patterns and the wrapping boundaries,
- the empty-board case is covered explicitly,
- component tests use `@vue/test-utils`, and anything timer-based uses fake timers,
  so no test depends on real time passing.

**End-to-end tests (Playwright):**

- the app loads with an empty board and a disabled Start button,
- the board renders a cell for every position (checking the four corners is enough),
- clicking a cell makes it alive, clicking it again makes it dead,
- Start begins the simulation, is disabled while running, and the board changes over time,
- Pause stops the simulation and re-enables Start,
- Reset empties the board and pauses the simulation.

E2E tests need stable selectors for the grid, the cells and the three buttons. Adding
`data-testid` attributes (for example `data-testid="start"` and `data-testid="cell-3-7"`,
0-based and row first, so `cell-3-7` is `board[3][7]`) is the simplest way to keep the tests
readable and independent of your styling and markup decisions.

The tests also need to read a cell's state without inspecting your CSS, so expose it on the
cell: `data-alive="true"` / `data-alive="false"`, or `aria-pressed` if the cells are
`<button>`s. `getByTestId("cell-3-7")` plus `toHaveAttribute("data-alive", "true")` is then
a complete assertion.

Keep in mind that a single live cell dies in the very first generation (it has no
neighbours), so a flow that watches the board evolve should draw a small oscillator — a
blinker — instead of one cell.

## Acceptance criteria

Your solution is complete when:

1. the game state is displayed on a 100 × 100 grid,
2. the rules above are implemented correctly, including the wrapping boundaries,
3. each generation is computed from the previous one,
4. the user can toggle cells, start, pause, and reset the simulation, with the documented button states,
5. patterns evolve in a predictable way,
6. the behavior is covered by tests, at the unit level (rules, edge cases, patterns) and
   from the user's point of view (the Playwright flows listed above).
