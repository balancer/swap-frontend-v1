<template>
    <div ref="icon" />
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
// @ts-ignore
import jazzicon from '@metamask/jazzicon';

export default defineComponent({
    props: {
        address: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            required: true,
        },
    },
    setup(props) {
        const icon = ref(null);

        onMounted(() => {
            update();
        });

        watch(props, () => {
            update();
        });

        function update(): void {
            const address = props.address;
            // @ts-ignore
            icon.value.innerHTML = '';
            // @ts-ignore
            icon.value.appendChild(jazzicon(props.size, parseInt(address.slice(2, 10), 16)));
        }

        return {
            icon,
        };
    },
});
</script>
