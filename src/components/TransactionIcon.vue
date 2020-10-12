<template>
    <img :src="statusIcon">
</template>

<script>
import { defineComponent, toRefs, computed } from 'vue';

import errorIcon from '@/assets/errorIcon.svg';
import successIcon from '@/assets/successIcon.svg';

export default defineComponent({
    props: {
        status: {
            type: Number,
            required: true,
        },
    },
    setup(props) {
        const { status } = toRefs(props);

        const statusIcon = computed(() => {
            if (status.value === 0) {
                // TODO 'pending' icon
                return '';
            }
            if (status.value === 1) {
                return successIcon;
            }
            if (status.value === 2) {
                return errorIcon;
            }
        });

        return {
            statusIcon,
        };
    },
});
</script>
