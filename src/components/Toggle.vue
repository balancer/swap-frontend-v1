<template>
    <div class="toggle">
        <div
            v-for="option in options"
            :key="option.id"
            class="toggle-option"
            :class="{ active: selected === option.id }"
            @click="selectOption(option)"
        >
            {{ option.title }}
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export interface ToggleOption {
    id: string;
    title: string;
}

export default defineComponent({
    props: {
        options: {
            type: Array,
            required: true,
        },
        selected: {
            type: String,
            required: true,
        },
    },
    emits: ['select'],
    setup(props, { emit }) {
        function selectOption(option: ToggleOption): void {
            emit('select', option.id);
        }

        return {
            selectOption,
        };
    },
});
</script>

<style scoped>
.toggle {
    background-color: var(--background-secondary);
    border-radius: var(--border-radius);
    display: flex;
    border: 1px solid var(--outline);
}

.toggle-option {
    height: 40px;
    cursor: pointer;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.toggle-option.active {
    background-color: var(--outline);
}
</style>
