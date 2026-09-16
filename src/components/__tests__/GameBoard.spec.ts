import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mount, type VueWrapper } from "@vue/test-utils";
import GameBoard from "../GameBoard.vue";
import { TICK_MS } from "@/game/game";

function cell(wrapper: VueWrapper, row: number, col: number) {
  return wrapper.get(`[data-testid="cell-${row}-${col}"]`);
}

function alive(wrapper: VueWrapper, row: number, col: number): boolean {
  return cell(wrapper, row, col).attributes("data-alive") === "true";
}

function startDisabled(wrapper: VueWrapper): boolean {
  return (wrapper.get('[data-testid="start"]').element as HTMLButtonElement)
    .disabled;
}

function pauseDisabled(wrapper: VueWrapper): boolean {
  return (wrapper.get('[data-testid="pause"]').element as HTMLButtonElement)
    .disabled;
}

/** Draw a vertical blinker centred on (row, col). */
async function drawBlinker(
  wrapper: VueWrapper,
  row: number,
  col: number,
): Promise<void> {
  await cell(wrapper, row - 1, col).trigger("click");
  await cell(wrapper, row, col).trigger("click");
  await cell(wrapper, row + 1, col).trigger("click");
}

/** Mount a small board: same component, faster suite. */
function mountSmall(size = 20, options: { attachTo?: HTMLElement } = {}) {
  return mount(GameBoard, { props: { size }, attachTo: options.attachTo });
}

describe("GameBoard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads empty and paused, Start and Pause disabled", () => {
    const wrapper = mountSmall();
    expect(wrapper.get('[data-testid="status"]').text()).toBe("paused");
    expect(startDisabled(wrapper)).toBe(true);
    expect(pauseDisabled(wrapper)).toBe(true);
    expect(alive(wrapper, 0, 0)).toBe(false);
    expect(alive(wrapper, 10, 10)).toBe(false);
    expect(alive(wrapper, 19, 19)).toBe(false);
    wrapper.unmount();
  });

  it("renders a cell for every position (four corners present)", () => {
    const wrapper = mountSmall();
    const last = 19;
    expect(wrapper.find('[data-testid="cell-0-0"]').exists()).toBe(true);
    expect(wrapper.find(`[data-testid="cell-0-${last}"]`).exists()).toBe(true);
    expect(wrapper.find(`[data-testid="cell-${last}-0"]`).exists()).toBe(true);
    expect(wrapper.find(`[data-testid="cell-${last}-${last}"]`).exists()).toBe(
      true,
    );
    wrapper.unmount();
  });

  it("clicking a cell toggles it alive, clicking again makes it dead", async () => {
    const wrapper = mountSmall();
    await cell(wrapper, 3, 7).trigger("click");
    expect(alive(wrapper, 3, 7)).toBe(true);
    expect(startDisabled(wrapper)).toBe(false);
    await cell(wrapper, 3, 7).trigger("click");
    expect(alive(wrapper, 3, 7)).toBe(false);
    expect(startDisabled(wrapper)).toBe(true);
    wrapper.unmount();
  });

  it("Start begins the loop, disables Start, board evolves", async () => {
    const wrapper = mountSmall();
    await drawBlinker(wrapper, 10, 10);
    await wrapper.get('[data-testid="start"]').trigger("click");
    expect(wrapper.get('[data-testid="status"]').text()).toBe("running");
    expect(startDisabled(wrapper)).toBe(true);
    expect(pauseDisabled(wrapper)).toBe(false);
    expect(alive(wrapper, 10, 10)).toBe(true);
    await vi.advanceTimersByTimeAsync(TICK_MS);
    // Blinker is now horizontal: (9,10) died, (10,9) was born.
    expect(alive(wrapper, 9, 10)).toBe(false);
    expect(alive(wrapper, 10, 9)).toBe(true);
    wrapper.unmount();
  });

  it("Pause stops the loop and re-enables Start", async () => {
    const wrapper = mountSmall();
    await drawBlinker(wrapper, 10, 10);
    await wrapper.get('[data-testid="start"]').trigger("click");
    await wrapper.get('[data-testid="pause"]').trigger("click");
    expect(wrapper.get('[data-testid="status"]').text()).toBe("paused");
    expect(startDisabled(wrapper)).toBe(false);
    expect(pauseDisabled(wrapper)).toBe(true);
    const before = alive(wrapper, 9, 10);
    await vi.advanceTimersByTimeAsync(TICK_MS * 5);
    expect(alive(wrapper, 9, 10)).toBe(before);
    wrapper.unmount();
  });

  it("toggling while running never stops the loop", async () => {
    const wrapper = mountSmall();
    await drawBlinker(wrapper, 10, 10);
    await wrapper.get('[data-testid="start"]').trigger("click");
    await cell(wrapper, 15, 15).trigger("click");
    expect(alive(wrapper, 15, 15)).toBe(true);
    expect(wrapper.get('[data-testid="status"]').text()).toBe("running");
    wrapper.unmount();
  });

  it("Reset clears the board and pauses the simulation", async () => {
    const wrapper = mountSmall();
    await drawBlinker(wrapper, 10, 10);
    await wrapper.get('[data-testid="start"]').trigger("click");
    await wrapper.get('[data-testid="reset"]').trigger("click");
    expect(wrapper.get('[data-testid="status"]').text()).toBe("paused");
    expect(alive(wrapper, 9, 10)).toBe(false);
    expect(alive(wrapper, 10, 10)).toBe(false);
    expect(alive(wrapper, 11, 10)).toBe(false);
    expect(startDisabled(wrapper)).toBe(true);
    expect(pauseDisabled(wrapper)).toBe(true);
    await vi.advanceTimersByTimeAsync(TICK_MS * 3);
    expect(alive(wrapper, 10, 10)).toBe(false);
    wrapper.unmount();
  });

  it("clears the timer when unmounted", async () => {
    const wrapper = mountSmall();
    await drawBlinker(wrapper, 10, 10);
    await wrapper.get('[data-testid="start"]').trigger("click");
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("moves keyboard focus to a cell through the exposed focusCell helper", async () => {
    const wrapper = mountSmall(20, { attachTo: document.body });
    // Exercise focusCell on the GameBoard, which reaches through the
    // BoardGrid template ref down to the BoardCell button refs.
    const vm = wrapper.vm as unknown as {
      focusCell: (row: number, col: number) => void;
    };
    vm.focusCell(2, 3);
    await wrapper.vm.$nextTick();
    const focused = document.activeElement as HTMLElement | null;
    expect(focused?.getAttribute("data-testid")).toBe("cell-2-3");
    // Unknown coordinates are a silent no-op, focus stays where it was.
    vm.focusCell(99, 99);
    await wrapper.vm.$nextTick();
    expect(
      (document.activeElement as HTMLElement | null)?.getAttribute(
        "data-testid",
      ),
    ).toBe("cell-2-3");
    wrapper.unmount();
  });
});
