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
    color: var(--info);
    text-decoration: underline;
    cursor: pointer;
    font-size: 14px;
}
</style>
