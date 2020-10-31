<template>
    <img :src="icon">
</template>

<script>
import { defineComponent, computed } from 'vue';

export default defineComponent({
    props: {
        connector: {
            type: String,
            required: true,
        },
    },
    setup(props) {
        const icon = computed(() => {
            return `https://raw.githubusercontent.com/snapshot-labs/lock/master/connectors/assets/${props.connector}.png`;
        });

        return {
            icon,
        };
    },
});
</script>
