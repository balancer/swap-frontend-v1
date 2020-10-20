<template>
    <img :src="statusIcon">
</template>

<script>
import { defineComponent, toRefs, computed } from 'vue';

import pendingIcon from '@/assets/pendingIcon.svg';
import successIcon from '@/assets/successIcon.svg';
import errorIcon from '@/assets/errorIcon.svg';

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
                return pendingIcon;
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
