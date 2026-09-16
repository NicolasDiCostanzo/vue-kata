<script setup lang="ts">
/**
 * Start / Pause / Reset buttons plus the running/paused status line.
 * Purely presentational: every click is emitted upward, and the disabled
 * states come in as props so this component never second-guesses the game.
 */
defineProps<{
  running: boolean;
  canStart: boolean;
}>();

const emit = defineEmits<{
  start: [];
  pause: [];
  reset: [];
}>();
</script>

<template>
  <div class="controls">
    <button
      type="button"
      data-testid="start"
      :disabled="!canStart"
      @click="emit('start')"
    >
      Start
    </button>
    <button
      type="button"
      data-testid="pause"
      :disabled="!running"
      @click="emit('pause')"
    >
      Pause
    </button>
    <button type="button" data-testid="reset" @click="emit('reset')">
      Reset
    </button>
    <p class="status" data-testid="status">
      {{ running ? "running" : "paused" }}
    </p>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status {
  margin: 0 0 0 0.5rem;
  font-style: italic;
}
</style>
