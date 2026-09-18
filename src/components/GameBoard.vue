<script setup lang="ts">
import { toRef, watchEffect, reactive } from 'vue';
import CellUnit from './CellUnit.vue';
import { Game } from '@/scripts/game.ts';

const game = reactive(new Game());
const props = defineProps({
    isPlaying: {
        type: Boolean,
        required: true
    }
})

let isPlayingRef = toRef(() => props.isPlaying);
let intervalId: ReturnType<typeof setInterval> | undefined;

watchEffect(() => {
    if (isPlayingRef.value) {
        intervalId = setInterval(() => game.nextGeneration(), 500);
    } else {
        clearInterval(intervalId);
    }
});

</script>

<template>
    <span>
        <span class="row" v-for="(x, iX) in game.cellGrid">
            <CellUnit class="column" :is-alive="y" v-for="(y, iY) in game.cellGrid[iX]"
                @toggle-state="game.updateCellState(iX, iY)"></CellUnit>
        </span>
    </span>
</template>

<style scoped>
.row {
    display: flex;
    flex-direction: row;
}

.column {
    display: flex;
    flex-direction: column;
}
</style>