<template>
    <button
        :class="{ primary }"
    >
        {{ text }}
    </button>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
    props: {
        text: {
            type: String,
            required: true,
        },
        primary: {
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
</style>
