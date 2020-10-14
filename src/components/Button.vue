<template>
    <button
        :class="{ primary }"
    >
        <LoadingIndicator v-if="loading" />
        {{ text }}
    </button>
</template>

<script>
import { defineComponent } from 'vue';

import LoadingIndicator from '@/components/LoadingIndicator.vue';

export default defineComponent({
    components: {
        LoadingIndicator,
    },
    props: {
        text: {
            type: String,
            required: true,
        },
        primary: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
});
</script>

<style scoped>
button {
    height: var(--block-height);
    width: 170px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    background: var(--background-secondary);
    border: 1px solid var(--outline);
    color: var(--text-primary);
    border-radius: 4px;
    cursor: pointer;
}

button.primary {
    background: var(--accent);
    border-color: var(--accent);
}

button:disabled {
    background: var(--text-secondary);
    border-color: var(--text-secondary);
    cursor: not-allowed;
}

button:hover {
    background: var(--background-primary);
}

button.primary:hover {
    background: var(--accent-dark);
    border-color: var(--accent-dark);
}

button:disabled:hover {
    background: var(--text-secondary);
    border-color: var(--text-secondary);
    cursor: not-allowed;
}
</style>
