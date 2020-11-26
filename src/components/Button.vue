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
    font-size: var(--font-size-large);
    background: var(--background-secondary);
    color: var(--text-primary);
    border-radius: var(--border-radius-medium);
    border-color: var(--background-secondary);
    cursor: pointer;
    transition: background 0.25s ease-in, border-color 0.25s ease-in;
}

button.primary {
    background: var(--accent);
}

button:hover {
    background: var(--background-primary);
}

button.primary:hover {
    background: var(--accent-dark);
}

button:disabled,
button:disabled:hover {
    background: var(--text-secondary);
    cursor: not-allowed;
    transition: background 0.35s ease-out, border-color 0.35s ease-out;
}
</style>
