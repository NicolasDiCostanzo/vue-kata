import { describe, expect, it } from "vitest";

import {
  BOARD_SIZE,
  countLiveNeighbors,
  createEmptyBoard,
  hasLiveCells,
  isAlive,
  nextCellState,
} from "../game";
import { boardFrom, boardToStrings } from "./fixtures";

describe("createEmptyBoard", () => {
  it("defaults to a BOARD_SIZE x BOARD_SIZE board with every cell dead", () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(BOARD_SIZE);
    expect(board[0]).toHaveLength(BOARD_SIZE);
    expect(hasLiveCells(board)).toBe(false);
  });

  it("creates a small empty board on request", () => {
    expect(boardToStrings(createEmptyBoard(3))).toEqual(["---", "---", "---"]);
  });
});

describe("isAlive / hasLiveCells", () => {
  it("reads cells and treats out-of-range access as dead", () => {
    const board = boardFrom(["*-", "--"]);
    expect(isAlive(board, 0, 0)).toBe(true);
    expect(isAlive(board, 0, 1)).toBe(false);
    expect(isAlive(board, 9, 9)).toBe(false);
    expect(isAlive(board, -1, 0)).toBe(false);
  });

  it("detects whether any cell is alive", () => {
    expect(hasLiveCells(createEmptyBoard(4))).toBe(false);
    expect(hasLiveCells(boardFrom(["---", "-*-", "---"]))).toBe(true);
  });
});

describe("countLiveNeighbors", () => {
  it("counts 0 neighbours for a lone cell", () => {
    expect(countLiveNeighbors(boardFrom(["---", "-*-", "---"]), 1, 1)).toBe(0);
  });

  it("counts the neighbours of the middle of a vertical blinker", () => {
    const board = boardFrom(["-----", "--*--", "--*--", "--*--", "-----"]);
    expect(countLiveNeighbors(board, 2, 2)).toBe(2);
  });

  it("wraps around every edge: a corner neighbours the opposite corner", () => {
    const board = boardFrom(["*--", "---", "---"]);
    expect(countLiveNeighbors(board, 2, 2)).toBe(1);
    expect(countLiveNeighbors(board, 0, 2)).toBe(1);
    expect(countLiveNeighbors(board, 2, 0)).toBe(1);
    expect(countLiveNeighbors(board, 1, 1)).toBe(1);
  });

  it("returns 0 for an empty board", () => {
    expect(countLiveNeighbors([], 0, 0)).toBe(0);
    expect(countLiveNeighbors([[]], 0, 0)).toBe(0);
  });
});

describe("nextCellState", () => {
  // [description, board, row, col, expected]
  const cases: Array<[string, string[], number, number, boolean]> = [
    [
      "live cell, 0 neighbours: dies (underpopulation)",
      ["---", "-*-", "---"],
      1,
      1,
      false,
    ],
    [
      "live cell, 1 neighbour: dies (underpopulation)",
      ["**-", "---", "---"],
      0,
      0,
      false,
    ],
    [
      "live cell, 2 neighbours: survives",
      ["-----", "--*--", "--*--", "--*--", "-----"],
      2,
      2,
      true,
    ],
    [
      "live cell, 3 neighbours: survives",
      ["**---", "**---", "-----", "-----", "-----"],
      1,
      1,
      true,
    ],
    [
      "live cell, 4 neighbours: dies (overpopulation)",
      ["-----", "--*--", "-***-", "--*--", "-----"],
      2,
      2,
      false,
    ],
    [
      "dead cell, exactly 3 neighbours: becomes alive",
      ["**---", "*----", "-----", "-----", "-----"],
      1,
      1,
      true,
    ],
    [
      "dead cell, 2 neighbours: stays dead",
      ["**---", "-----", "-----", "-----", "-----"],
      1,
      0,
      false,
    ],
    [
      "dead cell, 4 neighbours: stays dead",
      // (2,2) sees (1,1), (1,2), (1,3) and (3,2): 4 neighbours.
      ["-----", "-***-", "-----", "--*--", "-----"],
      2,
      2,
      false,
    ],
  ];

  it.each(cases)("%s", (_label, lines, row, col, expected) => {
    expect(nextCellState(boardFrom(lines), row, col)).toBe(expected);
  });
});
