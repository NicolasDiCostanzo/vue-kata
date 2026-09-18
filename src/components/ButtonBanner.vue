<script setup lang="ts">

const emit = defineEmits(['togglePlayState'])
const props = defineProps({
    isPlaying: {
    type: Boolean,
    required: true
  }
})

let isPlaying = props.isPlaying;

function togglePlayState() {
    isPlaying = !isPlaying;
    emit("togglePlayState", isPlaying);
}
</script>

<template>
    <button v-on:click="togglePlayState">Play</button>
</template>

<style scoped></style>