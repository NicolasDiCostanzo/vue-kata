/**
 * Pure Conway's Game of Life logic.
 *
 * Everything in this module is framework-free on purpose: the rules are pure
 * functions of `(board, row, col)`, so they can be unit-tested on tiny boards
 * without mounting any component.
 *
 * The board wraps on every edge (toroidal topology): the dimensions are always
 * derived from the board itself, never from `BOARD_SIZE`, so tests can use
 * small boards (3x3, 5x5, 10x10) and still exercise the real wrapping maths.
 */

export const BOARD_SIZE = 100;

/** Milliseconds between generations while the simulation is running. */
export const TICK_MS = 200;

/** `true` = alive, `false` = dead. Row first, 0-based: `board[row][col]`. */
export type Board = boolean[][];

/** A brand-new empty board (every cell dead). */
export function createEmptyBoard(size: number = BOARD_SIZE): Board {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );
}

export function rowCount(board: Board): number {
  return board.length;
}

export function colCount(board: Board): number {
  return board[0]?.length ?? 0;
}

/**
 * Read one cell. Out-of-range access is treated as dead instead of throwing,
 * which keeps the `noUncheckedIndexedAccess` compiler option happy without
 * non-null assertions.
 */
export function isAlive(board: Board, row: number, col: number): boolean {
  return board[row]?.[col] ?? false;
}

/** True when at least one cell on the board is alive. */
export function hasLiveCells(board: Board): boolean {
  return board.some((row) => row.some(Boolean));
}

/** Wrap an index into `[0, size)` so edges neighbour the opposite edge. */
function wrap(index: number, size: number): number {
  return ((index % size) + size) % size;
}

/** Count the live neighbours of a cell, wrapping around every edge. */
export function countLiveNeighbors(
  board: Board,
  row: number,
  col: number,
): number {
  const rows = rowCount(board);
  const cols = colCount(board);
  if (rows === 0 || cols === 0) {
    return 0;
  }
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) {
        continue;
      }
      if (isAlive(board, wrap(row + dr, rows), wrap(col + dc, cols))) {
        count++;
      }
    }
  }
  return count;
}

/** Decide whether a cell is alive in the next generation. */
export function nextCellState(board: Board, row: number, col: number): boolean {
  const alive = isAlive(board, row, col);
  const neighbors = countLiveNeighbors(board, row, col);
  if (alive) {
    // Survival: 2 or 3 neighbours. Anything else is under/overpopulation.
    return neighbors === 2 || neighbors === 3;
  }
  // Reproduction: exactly 3 neighbours.
  return neighbors === 3;
}

/**
 * Compute the next generation as a brand-new board.
 *
 * Every cell is derived from the *current* board (simultaneous update), and
 * the input board is never mutated, so the previous generation stays intact
 * and Vue's reactivity picks up the new row arrays.
 */
export function nextGeneration(board: Board): Board {
  return board.map((row, rowIndex) =>
    row.map((_, colIndex) => nextCellState(board, rowIndex, colIndex)),
  );
}
