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
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-large);
    font-weight: bold;
    color: var(--text-primary);
    background: var(--background-control);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--border);
    border-radius: var(--border-radius-medium);
    cursor: pointer;
    transition: box-shadow 0.25s, transform 0.25s;
}

button:hover {
    background: var(--background-primary);
}

button.primary {
    background: linear-gradient(185deg, #f0f 0%, #00f 100%);
    color: #fff;
}

button.primary:hover {
    box-shadow: 0 15px 20px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

button:disabled,
button:disabled:hover {
    opacity: 0.35;
    cursor: not-allowed;
}
</style>
