<template>
    <button>
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
    },
});
</script>

<style scoped>
button {
    height: var(--block-height);
    width: 160px;
    font-size: 16px;
    background: var(--accent);
    color: var(--text-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
</style>
