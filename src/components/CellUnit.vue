<script setup lang="ts">
const props = defineProps({
    isAlive: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['toggleState'])

function toggleState() {
    emit("toggleState", !props.isAlive);
}
</script>

<template>
    <button class="cell" :class="isAlive ? 'alive' : 'dead'" v-on:click="toggleState"/>
</template>

<style scoped>
button {
    all: unset;
}
.cell {
    width: 7.5px;
    height: 7.5px;
    border: 0.5px solid rgba(0, 0, 0, 0.323);
    box-sizing: border-box;
}

.alive {
    background-color: green;
}

.dead {
    background-color: white;
}
</style>