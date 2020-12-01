<template>
    <div
        class="icon-wrapper"
        @click="toggle"
    >
        <Icon
            class="icon"
            :title="'pairToggle'"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import Icon from '@/components/Icon.vue';

export default defineComponent({
    components: {
        Icon,
    },
    emits: ['toggle'],
    setup(props, { emit }) {
        function toggle(): void {
            emit('toggle');
        }

        return {
            toggle,
        };
    },
});
</script>

<style scoped>
.icon-wrapper {
    width: 42px;
    height: 42px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--background-secondary);
    border: 1px solid var(--border-input);
    border-radius: 50%;
    cursor: pointer;
}

.icon-wrapper:hover {
    background: var(--background-hover);
}

.icon {
    width: 20px;
    height: 16px;
    color: var(--text-primary);
}
</style>
