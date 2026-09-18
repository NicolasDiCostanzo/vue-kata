<script setup lang="ts">
import { ref } from 'vue';
import ButtonBanner from './components/ButtonBanner.vue';
import GameBoard from './components/GameBoard.vue';

let isPlaying = ref<boolean>(false);

</script>

<template>
  <div class="wrapper">
    <ButtonBanner :is-playing="isPlaying" @toggle-play-state="isPlaying = $event"></ButtonBanner>
    <GameBoard :is-playing="isPlaying"></GameBoard>
  </div>
</template>

<style scoped>
.wrapper {
  width: 100vh;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
