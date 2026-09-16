import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";
import BoardCell from "../BoardCell.vue";
import BoardGrid from "../BoardGrid.vue";
import GameControls from "../GameControls.vue";
import { createEmptyBoard } from "@/game/game";

const last = 4;

describe("BoardCell", () => {
  it("renders its coordinates and liveness, and emits toggle with its position", async () => {
    const wrapper = mount(BoardCell, {
      props: { row: 2, col: 3, alive: false },
    });
    const button = wrapper.get("button");
    expect(button.attributes("data-testid")).toBe("cell-2-3");
    expect(button.attributes("data-alive")).toBe("false");
    expect(button.attributes("aria-pressed")).toBe("false");

    await button.trigger("click");
    expect(wrapper.emitted("toggle")).toEqual([[2, 3]]);

    await wrapper.setProps({ alive: true });
    expect(button.attributes("data-alive")).toBe("true");
    expect(button.attributes("aria-pressed")).toBe("true");
  });
});

describe("BoardGrid", () => {
  function mountGrid(aliveAt: Array<[number, number]> = []) {
    const board = createEmptyBoard(last + 1);
    for (const [row, col] of aliveAt) {
      const boardRow = board[row];
      if (boardRow !== undefined) {
        boardRow[col] = true;
      }
    }
    // attachTo a live DOM node: .focus() is a no-op on detached elements.
    return mount(BoardGrid, { props: { board }, attachTo: document.body });
  }

  it("renders every cell and forwards child toggles with coordinates", async () => {
    const wrapper = mountGrid([[1, 1]]);
    expect(wrapper.find('[data-testid="board"]').exists()).toBe(true);
    expect(
      wrapper.get('[data-testid="cell-1-1"]').attributes("data-alive"),
    ).toBe("true");
    await wrapper.get('[data-testid="cell-2-3"]').trigger("click");
    expect(wrapper.emitted("toggle")).toEqual([[2, 3]]);
  });

  it("focusCell moves keyboard focus to the requested cell", async () => {
    const wrapper = mountGrid();
    const vm = wrapper.vm as unknown as {
      focusCell: (row: number, col: number) => void;
    };
    vm.focusCell(0, 0);
    await wrapper.vm.$nextTick();
    expect(
      (document.activeElement as HTMLElement | null)?.getAttribute(
        "data-testid",
      ),
    ).toBe("cell-0-0");
    // Unknown coordinates are a silent no-op.
    vm.focusCell(99, 99);
    await wrapper.vm.$nextTick();
    expect(
      (document.activeElement as HTMLElement | null)?.getAttribute(
        "data-testid",
      ),
    ).toBe("cell-0-0");
    wrapper.unmount();
  });
});

describe("GameControls", () => {
  it("disables Start/Pause from props and emits start/pause/reset", async () => {
    const wrapper = mount(GameControls, {
      props: { running: false, canStart: false },
    });
    expect(wrapper.get('[data-testid="status"]').text()).toBe("paused");
    expect(
      (wrapper.get('[data-testid="start"]').element as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (wrapper.get('[data-testid="pause"]').element as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    await wrapper.setProps({ canStart: true });
    await wrapper.get('[data-testid="start"]').trigger("click");
    expect(wrapper.emitted("start")).toHaveLength(1);

    await wrapper.setProps({ running: true, canStart: false });
    expect(wrapper.get('[data-testid="status"]').text()).toBe("running");
    await wrapper.get('[data-testid="pause"]').trigger("click");
    expect(wrapper.emitted("pause")).toHaveLength(1);

    await wrapper.get('[data-testid="reset"]').trigger("click");
    expect(wrapper.emitted("reset")).toHaveLength(1);
  });
});
