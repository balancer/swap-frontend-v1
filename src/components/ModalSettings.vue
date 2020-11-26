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
                        >
                    </div>
                </div>
            </div>
            <div class="section">
                <div class="section-header">
                    Token list
                </div>
                <div class="section-body">
                    <div class="list-selector">
                        <div
                            class="list-selected list-option"
                            @click="toggleListOptions"
                        >
                            <img
                                class="list-logo"
                                :src="list.logoURI"
                            >
                            <div class="list-title">
                                {{ list.name }}
                            </div>
                        </div>
                        <div
                            v-if="listOptionsVisible"
                            class="list-options"
                        >
                            <div
                                v-for="(list, listId) in lists"
                                :key="listId"
                                class="list-option"
                                @click="selectList(listId)"
                            >
                                <img
                                    class="list-logo"
                                    :src="list.logoURI"
                                >
                                <div class="list-title">
                                    {{ list.name }}
                                </div>
                            </div>
                        </div>
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
import { DEFAULT_LIST } from '@/utils/list';
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
        const listOptionsVisible = ref(false);
        const listId = ref(DEFAULT_LIST);

        const isCustomSlippage = computed(() => {
            return !slippageOptions.includes(slippage.value);
        });

        const list = computed(() => lists.value[listId.value]);
        const lists = computed(() => store.state.assets.lists);

        onMounted(() => {
            const slippageNumber = Storage.getSlippage();
            slippage.value = slippageNumber;
            if (isCustomSlippage.value) {
                slippageInput.value = (slippage.value * 100).toFixed(1);
            }
            listId.value = Storage.getList();
            store.dispatch('assets/fetchLists');
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

        function toggleListOptions(): void {
            listOptionsVisible.value = !listOptionsVisible.value;
        }

        function selectList(list: string): void {
            listOptionsVisible.value = false;
            listId.value = list;
            Storage.saveList(list);
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

            list,
            lists,
            listOptionsVisible,
            toggleListOptions,
            selectList,

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
    padding: 8px;
    margin-right: 8px;
    border: 1px solid var(--outline);
    border-radius: var(--border-radius);
    background: var(--background-secondary);
    cursor: pointer;
}

input.slippage-option {
    outline: none;
    color: var(--text-primary);
    font-size: 16px;
    width: 38px;
}

.slippage-option.selected {
    border-color: var(--text-primary);
}

.slippage-option:hover {
    background: var(--background-primary);
}

.list-selected {
    border: 1px solid var(--outline);
    background: var(--background-secondary);
}

.list-option {
    width: 200px;
    padding: 8px;
    display: flex;
    align-items: center;
    border-radius: var(--border-radius);
    cursor: pointer;
}

.list-option:hover {
    background: var(--background-primary);
}

.list-logo {
    width: 16px;
    height: 16px;
    padding: 2px;
    border-radius: 50%;
    background: var(--text-primary);
}

.list-title {
    margin-left: 8px;
}

.list-options {
    position: absolute;
    margin-top: 16px;
    border: 1px solid var(--outline);
    border-radius: var(--border-radius);
    background: var(--background-secondary);
}

</style>
