import { describe, expect, it } from "vitest";

import { createEmptyBoard, nextGeneration } from "../game";
import { boardFrom, boardToStrings } from "./fixtures";

describe("nextGeneration", () => {
  it("leaves an empty board empty", () => {
    expect(boardToStrings(nextGeneration(createEmptyBoard(4)))).toEqual([
      "----",
      "----",
      "----",
      "----",
    ]);
  });

  it("kills a single live cell in the first generation", () => {
    const board = boardFrom(["---", "-*-", "---"]);
    expect(boardToStrings(nextGeneration(board))).toEqual([
      "---",
      "---",
      "---",
    ]);
  });

  it("keeps a block unchanged (still life)", () => {
    const block = boardFrom([
      "------",
      "-**---",
      "-**---",
      "------",
      "------",
      "------",
    ]);
    const next = nextGeneration(block);
    expect(boardToStrings(next)).toEqual(boardToStrings(block));
  });

  it("flips a blinker vertical -> horizontal -> vertical (period 2)", () => {
    const vertical = boardFrom(["-----", "--*--", "--*--", "--*--", "-----"]);
    const horizontal = ["-----", "-----", "-***-", "-----", "-----"];
    expect(boardToStrings(nextGeneration(vertical))).toEqual(horizontal);
    expect(boardToStrings(nextGeneration(boardFrom(horizontal)))).toEqual(
      boardToStrings(vertical),
    );
  });

  it("moves a glider one cell down and right after 4 generations", () => {
    // Placed away from every edge so wrapping cannot interfere.
    const start = boardFrom([
      "----------",
      "----------",
      "---*------",
      "----*-----",
      "--***-----",
      "----------",
      "----------",
      "----------",
      "----------",
      "----------",
    ]);
    const expected = boardFrom([
      "----------",
      "----------",
      "----------",
      "----*-----",
      "-----*----",
      "---***----",
      "----------",
      "----------",
      "----------",
      "----------",
    ]);
    let board = start;
    for (let i = 0; i < 4; i++) {
      board = nextGeneration(board);
    }
    expect(boardToStrings(board)).toEqual(boardToStrings(expected));
  });

  it("wraps across the edge: a row over the boundary flips to a column", () => {
    // Three live cells in a row, straddling the left/right edge: like a
    // horizontal blinker, so it becomes a vertical line in column 0
    // (rows 4, 0, 1 via the top/bottom wrap).
    const row = boardFrom(["**--*", "-----", "-----", "-----", "-----"]);
    expect(boardToStrings(nextGeneration(row))).toEqual([
      "*----",
      "*----",
      "-----",
      "-----",
      "*----",
    ]);
  });

  it("does not mutate the input board", () => {
    const board = boardFrom(["-----", "--*--", "--*--", "--*--", "-----"]);
    const snapshot = boardToStrings(board);
    nextGeneration(board);
    expect(boardToStrings(board)).toEqual(snapshot);
  });

  it("returns new row arrays rather than editing rows in place", () => {
    const board = boardFrom(["---", "-*-", "---"]);
    const next = nextGeneration(board);
    expect(next).not.toBe(board);
    for (const [index, row] of board.entries()) {
      expect(next[index]).not.toBe(row);
    }
  });
});
