<script setup lang="ts">
import { useTemplateRef } from "vue";

/** One clickable cell. Stateless: its state lives in the board array above. */
const props = defineProps<{
  row: number;
  col: number;
  alive: boolean;
}>();

const emit = defineEmits<{
  toggle: [row: number, col: number];
}>();

// The native button. A `focus()` helper is exposed instead of the raw ref:
// exposed refs are unwrapped on the parent's instance proxy, which makes
// their type confusing — a method keeps the child API explicit.
const button = useTemplateRef<HTMLButtonElement>("button");

function onClick(): void {
  emit("toggle", props.row, props.col);
}

function focus(): void {
  button.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <button
    ref="button"
    type="button"
    class="cell"
    :class="{ alive }"
    :data-testid="`cell-${row}-${col}`"
    :data-alive="alive ? 'true' : 'false'"
    :aria-pressed="alive"
    :aria-label="`Cell ${row} ${col}`"
    @click="onClick"
  />
</template>

<style scoped>
.cell {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: #fff;
  cursor: pointer;
}

.cell.alive {
  background: #2c3e50;
}

@media (prefers-color-scheme: dark) {
  .cell {
    background: #222;
  }

  .cell.alive {
    background: #42b883;
  }
}
</style>
