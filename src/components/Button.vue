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
    font-weight: bold;
    color: var(--text-primary);
    background: var(--background-secondary);
    box-shadow: 0 5px 5px rgba(0, 0, 0, 0.1);
    border-radius: var(--border-radius-medium);
    border: none;
    cursor: pointer;
    transition: background 0.25s ease-in;
}

button.primary {
    background: linear-gradient(185deg, #f0f -100%, #00f 100%) 40% / 200%;
    transition: background 0.25s ease-in;
}

button:hover {
    background: var(--background-hover);
}

button.primary:hover {
    background: linear-gradient(185deg, #f0f -100%, #00f 100%) 70% / 200%;
}

button:disabled,
button:disabled:hover {
    background: var(--text-secondary);
    cursor: not-allowed;
}
</style>
