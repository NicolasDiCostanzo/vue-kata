# Vue Game of Life Kata Plan

A suggested order of work for the kata. Each step lists the notions it teaches, the goal,
the deliverable and the documentation to read.


The brief itself is in [CONWAY_GAME_OF_LIFE_KATA.md](./CONWAY_GAME_OF_LIFE_KATA.md).

## Getting started

```sh
npm install
npm run dev          # dev server on http://localhost:5173
npm test             # Vitest, watch mode
npm run test:e2e     # Playwright (starts the dev server for you)
npm run type-check   # vue-tsc
npm run lint
npm run test:e2e -- --ui   # Playwright UI mode: pick tests, step through, open traces
```

Two habits that make the rest of the kata much easier:

- keep the rules in plain TypeScript outside the components (for example in
  `src/game/`), so they can be tested without mounting anything;
- write the test together with the code, one rule at a time — the rules are pure
  functions, so a Vitest test is a couple of lines.

## 1. Board state

Important notions:
- reactive state
- refs
- arrays and nested data
- TypeScript types

Goal:
- Represent the grid as a 2D array and keep it reactive.

Deliverable:
- A reactive **100 × 100** board stored as a 2D array of booleans (`true` = alive, `false` = dead). The board starts empty.
- A `Board` type (for example `type Board = boolean[][]`) and a `BOARD_SIZE` constant, so
  the grid, the rules, the tests and the E2E selectors all agree on the shape and the
  dimensions of the data.

Gotcha:
- `tsconfig.app.json` enables `noUncheckedIndexedAccess`, so `board[row]` is typed
  `boolean[] | undefined` and `board[row][col]` is `boolean | undefined`. This is
  deliberate: handle the `undefined` case (a small helper, or `?? false`) rather than
  reaching for `!` non-null assertions.

Documentation:
- https://vuejs.org/api/reactivity-core.html
- https://www.typescriptlang.org/docs/handbook/2/everyday-types.html

## 2. Draw the grid

Important notions:
- v-for
- key
- class binding

Goal:
- Render rows and cells and visually distinguish alive/dead cells.
- Keep 10,000 cells visible, clickable and cheap to render.

Deliverable:
- A grid that renders all 100 × 100 cells from the board state and applies a distinct style
  to alive cells. Cells must stay visible and clickable at this size.
- Render the cells and nothing else: one element per cell, no nested wrappers per cell, and
  CSS (a grid layout, or `display: flex` rows) for the layout. Give the cells a fixed size
  so the board fits on screen.
- Since the board is a nested array, `v-for` over the rows and then over the cells, and use
  `:key` on both loops.
- Give the board and the cells stable hooks for the E2E tests (`data-testid="board"`,
  `data-testid="cell-{row}-{col}"`). This is what the Playwright flows in step 9 use.
- Use **0-based** indices with the row first, matching the array positions (`cell-3-7` is
  `board[3][7]`), so the E2E flows and the unit tests agree on which cell they mean.
- Make the alive/dead state observable without looking at CSS: a
  `data-alive="true|false"` attribute (or `aria-pressed` if you render each cell as a
  `<button>`) lets a Playwright test assert liveness through the DOM instead of through
  class names you may rename or restyle later.

Gotcha:
- The starter CSS is still the welcome-page layout: `src/assets/main.css` makes `#app` a
  two-column grid at `min-width: 1024px` and `base.css` centres `body` with flex. Left
  as-is, your board ends up in one half-width column. Override it in `App.vue` (or rewrite
  `main.css`) when you add the grid.

Optional tip:
- If a component test feels slow, accept the grid size as a prop defaulting to `BOARD_SIZE`:
  a test can then mount a 3 × 3 board instead of 10,000 cells. The E2E flows must still see
  the full 100 × 100 board.

Documentation:
- https://vuejs.org/guide/essentials/list.html
- https://vuejs.org/guide/essentials/class-and-style.html

## 3. Game rules logic

Important notions:
- pure functions
- composables (only if you need reactive state)
- separation of concerns

Goal:
- Implement the rules that decide survival, death, and birth.

Deliverable:
- A pure function that, given a board and a cell position, decides whether that cell is alive in the next generation. Neighbor counting uses **wrapping (toroidal)** boundaries.
- Derive the dimensions from the board itself (`board.length`, `board[row]?.length ?? 0`) or
  take the size as an argument instead of closing over the `BOARD_SIZE` constant. Tests can
  then use a 3 × 3 or 5 × 5 board — tiny, readable fixtures — and still exercise the real
  wrapping maths. A rule that always assumes 100 × 100 cannot be tested that way.
- The rules need nothing from Vue: a pure function is easier to test and easier to trust
  than a composable that hides state. Reach for a composable only when the logic has to own
  reactive state (as the simulation loop does in step 5).

Documentation:
- https://vuejs.org/guide/reusability/composables.html
- https://vitest.dev/guide/#writing-tests

## 4. Next generation

Important notions:
- computed values
- immutable updates
- methods

Goal:
- Count neighbors and build the next board state from the current one.

Deliverable:
- A function that returns a brand-new board computed entirely from the current one. The current board must not be mutated while computing, because all cells update simultaneously.
- Build the new rows as new arrays rather than editing the existing rows in place, so the
  state change stays visible to Vue's reactivity and the previous generation stays intact.

Documentation:
- https://vuejs.org/guide/essentials/computed.html
- https://vuejs.org/guide/essentials/reactivity-fundamentals.html

## 5. Simulation loop

Important notions:
- lifecycle hooks
- watchers (only if you need them)
- timers

Goal:
- Advance generations automatically with a simple play/pause flow.

Deliverable:
- A loop that advances the board on an interval while running and stops the timer when
  paused and when the component unmounts. The interval value is a free choice.
- Cleanup is part of the deliverable: a leaked timer keeps a removed component alive and
  makes the tests flaky. `onUnmounted` (or `onScopeDispose` inside a composable) is the
  place for it.
- Keep the loop testable: with `vi.useFakeTimers()` and `vi.advanceTimersByTime()` you can
  assert that *n* generations happened without waiting in real time.

Documentation:
- https://vuejs.org/guide/essentials/lifecycle.html
- https://vitest.dev/guide/mocking.html#timers

## 6. Toggle cells

Important notions:
- event handling
- state updates
- immutable updates

Goal:
- Let the user place their own pattern by clicking cells.

Deliverable:
- Clicking a cell toggles it between alive and dead. Toggling works both while paused and
  while the simulation is running, and it never stops or restarts the loop.
- Replace the rows you change instead of mutating them, and do not replace the whole board
  unnecessarily: with 10,000 cells, touching only what changed keeps the UI responsive.

Documentation:
- https://vuejs.org/guide/essentials/event-handling.html

## 7. User controls

Important notions:
- event handling
- state updates
- conditional UI
- disabled button states

Goal:
- Add start, pause and reset.

Deliverable:
- **Start:** begins the simulation. Disabled while running and disabled when the board is empty.
- **Pause:** stops the simulation. Disabled while paused.
- **Reset:** clears the board to all dead cells and pauses the simulation. Always enabled.
- There is no step button and no pattern presets in the UI.
- The disabled states belong on the buttons themselves (`:disabled`), not only in a class,
  so the user and Playwright see the same thing. A small status line ("running" /
  "paused") is a good use of conditional rendering.

Documentation:
- https://vuejs.org/guide/essentials/event-handling.html
- https://vuejs.org/guide/essentials/conditional.html

## 8. Classic patterns

Important notions:
- fixtures / data setup
- reusable constants
- parameterised tests

Goal:
- Test the board with a block, blinker, and glider.

Deliverable:
- Reusable fixtures for the three patterns, plus tests asserting:
  - the **block** is unchanged after any number of generations,
  - the **blinker** alternates between vertical and horizontal every generation,
  - the **glider** returns to its original shape, shifted one cell diagonally, after 4 generations.
- These patterns are test fixtures only; they are not exposed in the UI. Writing the
  fixtures as small helpers (place this pattern at this position on a board of a given
  size) keeps both the pattern data and the assertions easy to read.
- Keep the fixture boards small (8 × 8 or 10 × 10 is plenty) and place each pattern a few
  cells away from every edge. Because the boundaries wrap, a pattern sitting on an edge is
  a neighbour of its own copy on the opposite side, so it collides with itself instead of
  behaving like the classic pattern. Test the wrapping separately, on purpose, with a
  dedicated fixture.
- For the glider, four generations shift the whole shape one cell down and one cell to the
  right: assert the entire shape, not just one cell, and give it room to land.

Documentation:
- https://vitest.dev/guide/#writing-tests
- https://vitest.dev/api/#test-each

## 9. E2E testing

Important notions:
- browser automation
- user flows
- assertions
- locators and test fixtures

Goal:
- Check that the app works from the user point of view: loading the board, starting the simulation, and observing the evolution of cells.

Deliverable:
- Playwright flows covering: the app loads with an empty board and Start disabled; clicking a cell toggles it; Start begins the simulation and is disabled while running; Pause stops it; Reset clears the board and pauses.
- Assert liveness through the hooks from step 2: `data-testid` to find the cell,
  `data-alive` (or `aria-pressed`) to know whether it is alive — never through a class name
  or a colour, which are styling decisions the test should not depend on.
- Draw a pattern that survives before asserting that the board evolves: a single cell dies
  in the very first generation, so "Start the loop and watch a change" needs at least a
  blinker (three clicks in a column). Then assert *that* a known cell changes, not *how
  many* cells are alive, and allow the loop one interval before expecting anything.
- After Reset, the board is empty again, so the state to assert is: every checked cell is
  dead, Pause is disabled, and Start is disabled (empty board). That is the one flow where
  the "Start is disabled when the board is empty" rule is directly observable.
- The grid holds 10,000 cells. Checking the four corners (`cell-0-0`, `cell-0-99`,
  `cell-99-0`, `cell-99-99`) is enough to prove the whole board is rendered, and stays
  valid if you ever render the cells lazily.
- `e2e/smoke.spec.ts` is the starting point: it shows how the base URL and the server are
  configured. The `webServer` block in `playwright.config.ts` starts the dev server (the
  preview server on CI), so the tests never need a manually started server.
- Use `getByTestId` / `getByRole` with the `data-testid` attributes from step 2. Assert the
  button states directly (`await expect(startButton).toBeDisabled()`), and assert the board
  through the cells rather than through implementation details.
- Because the loop runs on a timer, avoid `waitForTimeout` and exact generation counts:
  assert a change with `expect.poll()` or `await expect(...).toPass()`, which retry until
  the condition holds, and pause/reset before counting anything.
- The config runs three browser projects (chromium, firefox, webkit). While iterating, run
  a single project with `npm run test:e2e -- --project=chromium`; run all three before
  calling the work done.

Documentation:
- https://playwright.dev/docs/intro
- https://playwright.dev/docs/locators
- https://playwright.dev/docs/test-fixtures
- https://playwright.dev/docs/assertions
- https://playwright.dev/docs/best-practices

## Optional extensions

Only if you still have time and want to explore more of the stack:

- move the board state into a Pinia store and keep the component a thin view;
- extract the whole game (board, rules, loop) into a `useGameOfLife()` composable;
- add a generation counter, a configurable speed, or a "randomise board" button;
- add component tests that assert the cell styles for alive and dead cells.

