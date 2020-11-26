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
    background: linear-gradient(190deg, #f0f -110%, #00f 100%);
    box-shadow: 0 5px 5px rgba(0, 0, 0, 0.1);
    border-radius: var(--border-radius-medium);
    border-color: var(--background-secondary);
    cursor: pointer;
}

button.primary {
    background: linear-gradient(190deg, #f0f -110%, #00f 100%);
}

button:hover {
    background: linear-gradient(190deg, #f0f -80%, #00f 100%);
}

button.primary:hover {
    background: linear-gradient(190deg, #f0f -80%, #00f 100%);
}

button:disabled,
button:disabled:hover {
    background: var(--text-secondary);
    cursor: not-allowed;
}
</style>
