<template>
    <Icon
        class="icon"
        :title="statusIcon"
    />
</template>

<script>
import { defineComponent, toRefs, computed } from 'vue';

import Icon from '@/components/Icon.vue';

export default defineComponent({
    components: {
        Icon,
    },
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
                return 'pending';
            }
            if (status.value === 1) {
                return 'success';
            }
            if (status.value === 2) {
                return 'error';
            }
        });

        return {
            statusIcon,
        };
    },
});
</script>

<style scoped>
.icon {
    width: 24px;
    height: 24px;
}
</style>
