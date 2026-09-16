<script setup lang="ts">
import { computed } from "vue";

import BoardCell from "./BoardCell.vue";
import type { Board } from "../game/game";

/**
 * Renders the board as rows of `BoardCell` and forwards their `toggle`
 * events upward with coordinates. Also owns the grid layout CSS.
 *
 * Template refs are collected per cell (function refs into a `Map`), so the
 * exposed `focusCell(row, col)` helper can move keyboard focus to one cell.
 */
const props = defineProps<{ board: Board }>();

const emit = defineEmits<{
  toggle: [row: number, col: number];
}>();

type CellInstance = InstanceType<typeof BoardCell>;

// Column count for the CSS grid, derived from the board itself.
const sizePx = computed(() => String(props.board.length));

const cells = new Map<string, CellInstance>();

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

// Function ref: Vue calls it with the child instance on mount and with
// `null` on unmount, so the map never holds stale entries. The parameter is
// `unknown` on purpose: template refs are typed as `Element | Component | null`,
// so accepting the narrower component instance directly would fail the type
// check — narrowing needs a runtime cast inside.
function cellRef(row: number, col: number) {
  return (instance: unknown) => {
    if (instance === null || instance === undefined) {
      cells.delete(cellKey(row, col));
    } else {
      cells.set(cellKey(row, col), instance as CellInstance);
    }
  };
}

function forwardToggle(row: number, col: number): void {
  emit("toggle", row, col);
}

/** Move keyboard focus to one cell (no-op for unknown coordinates). */
function focusCell(row: number, col: number): void {
  cells.get(cellKey(row, col))?.focus();
}

defineExpose({ focusCell });
</script>

<template>
  <div
    class="board"
    data-testid="board"
    role="grid"
    aria-label="Game of Life board"
  >
    <template v-for="(row, rowIndex) in board" :key="rowIndex">
      <BoardCell
        v-for="(alive, colIndex) in row"
        :key="`${rowIndex}-${colIndex}`"
        :row="rowIndex"
        :col="colIndex"
        :alive="alive"
        :ref="cellRef(rowIndex, colIndex)"
        @toggle="forwardToggle"
      />
    </template>
  </div>
</template>

<style scoped>
.board {
  display: grid;
  grid-template-columns: repeat(v-bind(sizePx), 7px);
  grid-auto-rows: 7px;
  gap: 1px;
  background: var(--color-border, #ddd);
  border: 1px solid var(--color-border, #ddd);
  /* Keep the whole 100x100 board on screen without page scroll. */
  max-width: 100%;
  overflow: auto;
}
</style>
