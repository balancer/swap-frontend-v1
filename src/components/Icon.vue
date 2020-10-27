<template>
    <div v-html="require(`!html-loader!./../assets/${title}Icon.svg`)" />
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
    props: {
        title: {
            type: String,
            required: true,
        },
    },
});
</script>
