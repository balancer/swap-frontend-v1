<template>
    <div class="wrapper">
        <div
            v-if="value > 0"
            class="label"
        >
            Price impact: {{ label }}
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
    props: {
        value: {
            type: Number,
            required: true,
        },
    },
    emits: ['change', 'update:buffer'],
    setup(props) {
        const label = computed(() => {
            if (props.value < 0.0001) {
                return '<0.01%';
            }
            return `${(props.value * 100).toFixed(2)}%`;
        });

        return {
            label,
        };
    },
});
</script>

<style scoped>
.wrapper {
    height: 26.5px;
    margin-top: 16px;
    display: flex;
    align-items: center;
    font-size: 14px;
    color: var(--text-secondary);
}

.label {
    display: flex;
    align-items: center;
}
</style>
