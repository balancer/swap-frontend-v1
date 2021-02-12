<template>
    <div
        class="button"
        @click="openSettingsModal"
    >
        <Icon
            class="icon"
            :title="'settings'"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';

import Icon from '@/components/Icon.vue';

export default defineComponent({
    components: {
        Icon,
    },
    setup() {
        const store = useStore<RootState>();

        function openSettingsModal(): void {
            store.dispatch('ui/openSettingsModal');
        }

        return {
            openSettingsModal,
        };
    },
});
</script>

<style scoped>
.button {
    width: 30px;
    height: 30px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    background: var(--background-control);
    border: 1px solid var(--border);
    border-radius: 50%;
    cursor: pointer;
}

.button:hover {
    background: var(--background-primary);
}

.icon {
    width: 18px;
    height: 18px;
}
</style>
