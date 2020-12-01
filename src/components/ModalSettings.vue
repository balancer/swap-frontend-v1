<template>
    <ModalBase
        :title="'Settings'"
        :open="open"
        @close="close"
    >
        <template #default>
            <div class="section">
                <div class="section-header">
                    Max slippage tolerance
                </div>
                <div class="section-body">
                    <div class="slippage-options">
                        <div
                            v-for="option in slippageOptions"
                            :key="option"
                            class="slippage-option"
                            :class="{ selected: slippage === option & !isCustomSlippage }"
                            @click="setSlippage(option)"
                        >
                            {{ formatSlippage(option) }}
                        </div>
                        <input
                            v-model="slippageInput"
                            class="slippage-option"
                            :class="{ selected: isCustomSlippage }"
                            placeholder="2.0"
                            type="number"
                        >
                    </div>
                </div>
            </div>
            <div class="section">
                <div class="section-header">
                    Transaction history
                </div>
                <div class="section-body">
                    <ButtonText
                        :text="'Clear'"
                        @click="clearTransactions"
                    />
                </div>
            </div>
            <div class="section">
                <div class="section-header">
                    Imported tokens
                </div>
                <div class="section-body">
                    <ButtonText
                        :text="'Clear'"
                        @click="clearAssets"
                    />
                </div>
            </div>
        </template>
    </ModalBase>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';
import { ValidationError, validateNumberInput } from '@/utils/validation';
import Storage from '@/utils/storage';

import ButtonText from '@/components/ButtonText.vue';
import ModalBase from '@/components/ModalBase.vue';

const slippageOptions = [0.001, 0.002, 0.005, 0.01];

export default defineComponent({
    components: {
        ButtonText,
        ModalBase,
    },
    props: {
        open: {
            type: Boolean,
            required: true,
        },
    },
    setup() {
        const store = useStore<RootState>();
        const slippage = ref(0);
        const slippageInput = ref('');

        const isCustomSlippage = computed(() => {
            return !slippageOptions.includes(slippage.value);
        });

        onMounted(() => {
            const slippageNumber = Storage.getSlippage();
            slippage.value = slippageNumber;
            if (isCustomSlippage.value) {
                slippageInput.value = (slippage.value * 100).toFixed(1);
            }
        });

        watch(slippageInput, () => {
            const validation = validateNumberInput(slippageInput.value);
            if (validation !== ValidationError.NONE) {
                return;
            }
            const slippageNumber = parseFloat(slippageInput.value) / 100;
            if (slippageNumber >= 0.1) {
                return;
            }
            setSlippage(slippageNumber);
        });

        function close(): void {
            store.dispatch('ui/closeSettingsModal');
        }

        function formatSlippage(slippageNumber: number): string {
            return `${(slippageNumber * 100).toFixed(1)}%`;
        }

        function setSlippage(slippageNumber: number): void {
            slippage.value = slippageNumber;
            Storage.saveSlippage(slippage.value);
        }

        function clearTransactions(): void {
            store.dispatch('account/clearTransactions');
            Storage.clearTransactions();
        }

        function clearAssets(): void {
            Storage.clearAssets();
        }

        return {
            close,

            slippageOptions,
            setSlippage,
            slippage,
            slippageInput,
            isCustomSlippage,
            formatSlippage,

            clearTransactions,
            clearAssets,
        };
    },
});
</script>

<style scoped>
.section {
    margin: 16px;
}

.section-header {
    font-weight: bold;
    margin-bottom: 8px;
}

.section-body {
    display: flex;
}

.slippage-options {
    display: flex;
}

.slippage-option {
    height: 44px;
    width: 56px;
    margin-right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-input);
    border-radius: var(--border-radius-small);
    background: var(--background-secondary);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

input.slippage-option {
    padding: 0;
    outline: none;
    color: var(--text-primary);
    font-size: 16px;
    text-align: center;
    cursor: text;
    box-shadow: none;
}

.slippage-option.selected {
    border-color: var(--text-primary);
}

.slippage-option:hover {
    background: var(--background-hover);
}
</style>
