import {
  computed,
  onScopeDispose,
  ref,
  toValue,
  type MaybeRefOrGetter,
} from "vue";

import {
  BOARD_SIZE,
  TICK_MS,
  createEmptyBoard,
  hasLiveCells,
  nextGeneration,
  type Board,
} from "../game/game";

/**
 * Owns all Game of Life state: the board, the running flag and the timer.
 *
 * Keeping this in a composable (instead of inside the component) means:
 * - the component stays a thin view: template + child components,
 * - the state logic is unit-testable through a tiny harness component,
 * - the timer is cleaned up with `onScopeDispose`, so it works no matter
 *   which component (or test) uses the composable.
 *
 * `size` accepts a plain value, a ref or a getter (`toValue` unwraps all
 * three), so callers can pass a reactive prop like `() => props.size`.
 */
export function useGameOfLife(
  size: MaybeRefOrGetter<number> = BOARD_SIZE,
  tickMs: MaybeRefOrGetter<number> = TICK_MS,
) {
  const board = ref<Board>(createEmptyBoard(toValue(size)));
  const running = ref(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  const hasAnyLiveCell = computed(() => hasLiveCells(board.value));
  // Start only guards *starting*: once running, the loop keeps going even
  // if the board goes empty (no end condition).
  const canStart = computed(() => !running.value && hasAnyLiveCell.value);

  function stopTimer(): void {
    if (timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  }

  function tick(): void {
    board.value = nextGeneration(board.value);
  }

  function start(): void {
    if (!canStart.value) {
      return;
    }
    running.value = true;
    stopTimer();
    timer = setInterval(tick, toValue(tickMs));
  }

  function pause(): void {
    if (!running.value) {
      return;
    }
    running.value = false;
    stopTimer();
  }

  function reset(): void {
    running.value = false;
    stopTimer();
    board.value = createEmptyBoard(toValue(size));
  }

  // Replace just the toggled row, so Vue patches one row instead of the
  // whole board. Never touches the timer: toggling works paused or running
  // and never stops, restarts or speeds up the loop.
  function toggleCell(row: number, col: number): void {
    const currentRow = board.value[row];
    if (currentRow === undefined || currentRow[col] === undefined) {
      return;
    }
    const nextRow = [...currentRow];
    nextRow[col] = !nextRow[col];
    board.value = board.value.map((r, index) => (index === row ? nextRow : r));
  }

  // A leaked timer keeps a removed component alive and makes tests flaky.
  onScopeDispose(stopTimer);

  return {
    board,
    running,
    hasAnyLiveCell,
    canStart,
    start,
    pause,
    reset,
    toggleCell,
    tick,
  };
}

/** The shape returned by {@link useGameOfLife}. */
export type GameOfLife = ReturnType<typeof useGameOfLife>;
