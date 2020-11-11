<template>
    <div class="wrapper">
        <div
            v-if="value > 0"
            class="label"
        >
            Price impact: {{ label }} +
            <input
                v-if="shown"
                v-autofocus
                :value="buffer"
                class="input control"
                @blur="hide"
                @keyup.enter="hide"
                @input="handleInputChange($event.target.value)"
            >
            <ButtonText
                v-else
                class="control"
                :text="`${buffer}%`"
                @click="show"
            />
            (buffer)
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

import { ValidationError, validateNumberInput } from '@/utils/validation';

import ButtonText from '@/components/ButtonText.vue';

export default defineComponent({
    components: {
        ButtonText,
    },
    props: {
        value: {
            type: Number,
            required: true,
        },
        buffer: {
            type: String,
            required: true,
        },
    },
    emits: ['change', 'update:buffer'],
    setup(props, { emit }) {
        const shown = ref(false);

        const label = computed(() => {
            if (props.value < 0.0001) {
                return '<0.01%';
            }
            return `${(props.value * 100).toFixed(2)}%`;
        });

        function show(): void {
            shown.value = true;
        }

        function hide(): void {
            shown.value = false;
            const slippageBufferValidation = validateNumberInput(props.buffer);
            if (slippageBufferValidation !== ValidationError.NONE) {
                handleInputChange('0.5');
            }
        }

        function handleInputChange(value: string): void {
            emit('update:buffer', value);
        }

        return {
            shown,
            label,
            show,
            hide,
            handleInputChange,
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

.control {
    margin: 0 4px;
}

.input {
    width: 24px;
    text-align: right;
    font-size: 14px;
    background: var(--background-secondary);
    border: 1px solid var(--outline);
    border-radius: var(--border-radius);
    color: var(--text-primary);
    outline: none;
}
</style>
