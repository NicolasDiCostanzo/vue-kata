import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { TICK_MS } from "@/game/game";
import { boardToStrings } from "@/game/__tests__/fixtures";
import { useGameOfLife, type GameOfLife } from "../useGameOfLife";

/**
 * Mount a throwaway host so the composable runs inside a real effect scope
 * (that's what makes `onScopeDispose` cleanup testable). Returns the
 * composable instance plus an `unmount` that simulates removing the UI.
 */
function mountGame(size = 5): { game: GameOfLife; unmount: () => void } {
  let game!: GameOfLife;
  const Host = defineComponent({
    setup() {
      game = useGameOfLife(size);
      return () => h("div");
    },
  });
  const wrapper = mount(Host);
  return { game, unmount: () => wrapper.unmount() };
}

function strings(game: GameOfLife): string[] {
  return boardToStrings(game.board.value);
}

describe("useGameOfLife", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with an empty board, paused, and Start disabled", () => {
    const { game, unmount } = mountGame();
    expect(strings(game)).toEqual([
      "-----",
      "-----",
      "-----",
      "-----",
      "-----",
    ]);
    expect(game.running.value).toBe(false);
    expect(game.canStart.value).toBe(false);
    unmount();
  });

  it("toggleCell flips one cell and enables Start", () => {
    const { game, unmount } = mountGame();
    game.toggleCell(1, 1);
    expect(game.board.value[1]?.[1]).toBe(true);
    expect(game.canStart.value).toBe(true);
    game.toggleCell(1, 1);
    expect(game.board.value[1]?.[1]).toBe(false);
    expect(game.canStart.value).toBe(false);
    // Out-of-range toggles are ignored, never throw.
    game.toggleCell(99, 99);
    unmount();
  });

  it("refuses to start on an empty board", () => {
    const { game, unmount } = mountGame();
    game.start();
    expect(game.running.value).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    unmount();
  });

  it("start advances a blinker on each interval, only one timer", async () => {
    const { game, unmount } = mountGame();
    game.toggleCell(1, 2);
    game.toggleCell(2, 2);
    game.toggleCell(3, 2);
    game.start();
    game.start(); // second call must not add another interval
    expect(game.running.value).toBe(true);
    expect(game.canStart.value).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(TICK_MS);
    // Vertical -> horizontal.
    expect(strings(game)).toEqual([
      "-----",
      "-----",
      "-***-",
      "-----",
      "-----",
    ]);
    unmount();
  });

  it("pause freezes the board", async () => {
    const { game, unmount } = mountGame();
    game.toggleCell(1, 2);
    game.toggleCell(2, 2);
    game.toggleCell(3, 2);
    game.start();
    game.pause();
    expect(game.running.value).toBe(false);
    expect(game.canStart.value).toBe(true);
    const frozen = strings(game);
    await vi.advanceTimersByTimeAsync(TICK_MS * 4);
    expect(strings(game)).toEqual(frozen);
    unmount();
  });

  it("reset clears the board and pauses", async () => {
    const { game, unmount } = mountGame();
    game.toggleCell(1, 2);
    game.toggleCell(2, 2);
    game.toggleCell(3, 2);
    game.start();
    await vi.advanceTimersByTimeAsync(TICK_MS);
    game.reset();
    expect(game.running.value).toBe(false);
    expect(game.canStart.value).toBe(false);
    expect(strings(game)).toEqual([
      "-----",
      "-----",
      "-----",
      "-----",
      "-----",
    ]);
    expect(vi.getTimerCount()).toBe(0);
    unmount();
  });

  it("stops the timer when the using scope is disposed", () => {
    const { game, unmount } = mountGame();
    game.toggleCell(2, 2);
    game.toggleCell(2, 3);
    game.toggleCell(3, 2);
    game.toggleCell(3, 3);
    game.start();
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
