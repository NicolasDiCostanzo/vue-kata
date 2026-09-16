<script setup lang="ts">
import { useTemplateRef } from "vue";

import { BOARD_SIZE } from "../game/game";
import { useGameOfLife } from "../composables/useGameOfLife";
import BoardGrid from "./BoardGrid.vue";
import GameControls from "./GameControls.vue";

/**
 * Thin orchestrator: owns one `useGameOfLife` instance and wires it to the
 * presentational children (`GameControls`, `BoardGrid`).
 *
 * `size` defaults to BOARD_SIZE (100) for the real app; tests may mount a
 * smaller board so 10,000 cells don't slow the suite down. The E2E flows
 * always see the full 100x100 board through `App.vue`.
 */
const props = withDefaults(defineProps<{ size?: number }>(), {
  size: BOARD_SIZE,
});

const { board, running, canStart, start, pause, reset, toggleCell, tick } =
  useGameOfLife(() => props.size);

// Template ref to the child grid: lets `focusCell` move keyboard focus to a
// cell, and exercises `useTemplateRef` + `defineExpose` across components.
const grid = useTemplateRef<InstanceType<typeof BoardGrid>>("grid");

function focusCell(row: number, col: number): void {
  grid.value?.focusCell(row, col);
}

// Exposed for component tests (fake timers assert on generations without
// waiting in real time).
defineExpose({
  board,
  running,
  start,
  pause,
  reset,
  toggleCell,
  tick,
  focusCell,
});
</script>

<template>
  <main class="game">
    <h1>Conway's Game of Life</h1>

    <GameControls
      :running="running"
      :can-start="canStart"
      @start="start"
      @pause="pause"
      @reset="reset"
    />

    <BoardGrid ref="grid" :board="board" @toggle="toggleCell" />
  </main>
</template>

<style scoped>
.game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}
</style>
