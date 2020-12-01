<template>
    <div class="button">
        {{ text }}
    </div>
</template>

<script lang="ts">
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
.button {
    padding: 4px;
    color: var(--text-control);
    font-size: var(--font-size-tiny);
    text-transform: capitalize;
    border: 1px solid var(--border-input);
    border-radius: var(--border-radius-small);
    background: var(--background-control);
    cursor: pointer;
}

.button:hover {
    background: var(--background-hover);
}
</style>
