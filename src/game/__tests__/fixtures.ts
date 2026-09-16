import type { Board } from "../game";

/** Build a board from readable rows: `"*"` = alive, anything else = dead. */
export function boardFrom(lines: string[]): Board {
  return lines.map((line) => [...line].map((ch) => ch === "*"));
}

/** Render a board back to strings so assertions stay readable. */
export function boardToStrings(board: Board): string[] {
  return board.map((row) => row.map((cell) => (cell ? "*" : "-")).join(""));
}
