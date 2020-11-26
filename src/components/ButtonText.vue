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
    color: var(--info);
    font-size: 14px;
    text-transform: uppercase;
    border: 1px solid var(--info);
    border-radius: var(--border-radius);
    cursor: pointer;
}
</style>
