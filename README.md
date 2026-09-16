# Conway's Game of Life — Vue Kata

A practice kata: build Conway's Game of Life in the browser with Vue 3, TypeScript,
Vitest and Playwright.

## The kata

- **[CONWAY_GAME_OF_LIFE_KATA.md](./CONWAY_GAME_OF_LIFE_KATA.md)** — the brief. Read this
  first: rules, board, controls, expected behaviour and acceptance criteria.
- **[VUE_GAME_OF_LIFE_KATA_PLAN.md](./VUE_GAME_OF_LIFE_KATA_PLAN.md)** — a suggested
  step-by-step plan that pairs each step with the Vue / TypeScript / testing notions it
  teaches and links to the relevant documentation.

The order of the plan is a suggestion, not a requirement. You are free to organise the
code as you see fit.

## Requirements

- Node.js `^22.18.0` or `>=24.12.0`
- `npm`

Install dependencies:

```sh
npm install
```

For the end-to-end tests you also need the Playwright browsers (first run only):

```sh
npx playwright install
```

On Linux, the browsers also need some system libraries. If launching a browser fails with
"Host system is missing dependencies to run browsers", install them with:

```sh
sudo npx playwright install-deps
```

## Commands

```sh
# Start the dev server with hot reload (http://localhost:5173)
npm run dev

# Build for production (output in dist/) and preview the build (http://localhost:4173)
npm run build
npm run preview

# Type-check the app, the configs, the unit tests and the e2e specs
npm run type-check

# Unit tests (Vitest, watch mode; press "q" to quit)
npm test
npm test -- --run                   # single run, e.g. for CI

# End-to-end tests (Playwright; the dev server is started automatically)
npm run test:e2e
npm run test:e2e -- --project=chromium
npm run test:e2e -- e2e/smoke.spec.ts
npm run test:e2e -- --ui

# Lint and format
npm run lint
npm run format
```

## Project structure

```text
e2e/                        Playwright specs and their tsconfig
public/                     Static assets served as-is
src/
  assets/                   Global CSS
  components/               Components and component unit tests (__tests__/)
  App.vue                   Root component
  main.ts                   App entry point
playwright.config.ts        Playwright projects (chromium, firefox, webkit) and webServer
vitest.config.ts            Vitest config (jsdom environment, e2e/ excluded)
```

Pure game logic has no dependency on Vue, so it can live outside the components (for
example in `src/game/`) and be unit-tested directly. Any component test belongs next to
the component in a `__tests__/` folder.

## Notes on the setup

- **TypeScript is pinned to `^6.0.3`.** The tooling in this project (`vue-tsc`, and
  therefore `npm run type-check`) does not support TypeScript 7 yet. If you upgrade
  TypeScript, check that `npm run type-check` still works.
- **Config files import each other with explicit extensions.** `vitest.config.ts` imports
  `./vite.config.ts` (with the extension). Vite's `configLoader: 'native'`, which is planned
  to become the default, resolves config imports with Node's native type-stripping, where a
  bare `./vite.config` fails to resolve. `tsconfig.node.json` therefore enables
  `allowImportingTsExtensions` so the import still type-checks.
- **Type-checking covers every project.** `npm run type-check` runs `vue-tsc --build` over the
  references in `tsconfig.json`: the app (`tsconfig.app.json`), the Node/config files
  (`tsconfig.node.json`), the tests (`tsconfig.vitest.json`) and the Playwright specs
  (`e2e/tsconfig.json`). A type error in a spec fails the same command as a type error in a
  component.
- **Vitest** runs component and unit tests in a `jsdom` environment; `e2e/` is excluded.
  Use `vi.useFakeTimers()` when testing anything timer-based so tests stay fast and
  deterministic.
- **Playwright** starts the dev server via `webServer` (the preview server on CI), so you
  do not need to run `npm run dev` yourself. Prefer user-facing locators
  (`getByRole`, `getByTestId`) over CSS selectors, and avoid fixed timeouts.
  The tests run headed locally and headless on CI (`headless: !!process.env.CI`).
- `src/App.vue` still renders `src/components/HelloWorld.vue`: the last piece of the starter
  template, kept only so the app boots. Replace both with your board, and delete
  `src/components/__tests__/HelloWorld.spec.ts` along with the component — otherwise that
  spec fails once the component is gone.
- The rest of the template has already been stripped: no Vue Router (the dependency has been
  removed too), no demo views, no example Pinia store. `src/main.ts` still installs Pinia, so
  a store is available if you want one; drop the import if you do not.
- `src/assets/main.css` still carries the welcome-page layout: a two-column `#app` grid at
  `min-width: 1024px`, centred by a flex `body`. Replace or override it when you draw the
  100 × 100 board, otherwise the board is squeezed into a single column.
