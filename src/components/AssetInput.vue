<template>
    <div class="asset-input">
        <div
            class="asset-wrapper"
            @click="openModal"
        >
            <div class="asset-meta">
                <AssetIcon
                    class="asset-icon"
                    :address="address"
                />
                <span
                    v-if="symbol.length <= 10"
                    class="asset-symbol"
                >
                    {{ symbol }}
                </span>
                <Tooltip v-else>
                    <template #trigger>
                        <span class="asset-symbol">{{ symbol }}</span>
                    </template>
                    <template #default>
                        <div>{{ symbol }}</div>
                    </template>
                </Tooltip>
            </div>
            <Icon
                class="chevron-icon"
                :title="'chevron'"
            />
        </div>
        <div class="amount-wrapper">
            <div class="amount">
                <div class="input-wrapper">
                    <div
                        v-if="loading"
                        class="loading"
                    />
                    <input
                        v-else
                        :value="amount"
                        class="input"
                        placeholder="0"
                        type="number"
                        @input="handleInputChange($event.target.value)"
                    >
                    <ButtonText
                        v-if="isMaxLabelShown"
                        :text="'max'"
                        class="max-button"
                        @click="setMax"
                    />
                </div>
                <div
                    class="label"
                    :class="{
                        warning: label.style === LabelStyle.Warning,
                        error: label.style === LabelStyle.Error,
                    }"
                >
                    {{ label.text }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { PropType, defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';
import { ETH_KEY, scale } from '@/utils/helpers';

import AssetIcon from '@/components/AssetIcon.vue';
import ButtonText from '@/components/ButtonText.vue';
import Icon from '@/components/Icon.vue';
import Tooltip from '@/components/Tooltip.vue';

export interface Label {
    text: string;
    style: LabelStyle;
}

export enum LabelStyle {
    Normal,
    Warning,
    Error,
}

export default defineComponent({
    components: {
        AssetIcon,
        ButtonText,
        Icon,
        Tooltip,
    },
    props: {
        modalKey: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        amount: {
            type: String,
            required: true,
        },
        label: {
            type: Object as PropType<Label>,
            default: {
                text: '',
                style: LabelStyle.Normal,
            },
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['change'],
    setup(props, { emit }) {
        const store = useStore<RootState>();

        const symbol = computed(() => {
            const assets = store.getters['assets/metadata'];
            const asset = assets[props.address];
            if (!asset) {
                return '';
            }
            return asset.symbol;
        });

        const isMaxLabelShown = computed(() => {
            if (props.modalKey !== 'input') {
                return false;
            }
            if (props.address === ETH_KEY) {
                return false;
            }
            const assets = store.getters['assets/metadata'];
            const { balances } = store.state.account;
            if (!balances) {
                return false;
            }
            const balance = balances[props.address];
            const assetMetadata = assets[props.address];
            if (!balance || !assetMetadata) {
                return false;
            }
            return true;
        });

        function setMax(): void {
            const assets = store.getters['assets/metadata'];
            const { balances } = store.state.account;
            const balance = balances[props.address];
            const assetDecimals = assets[props.address].decimals;
            const balanceNumber = new BigNumber(balance);
            const amountNumber = scale(balanceNumber, -assetDecimals);
            const amount = amountNumber.toString();
            handleInputChange(amount);
        }

        function handleInputChange(value: string): void {
            emit('change', value);
        }

        function openModal(): void {
            store.dispatch('ui/openAssetModal', props.modalKey);
        }

        return {
            LabelStyle,

            symbol,
            isMaxLabelShown,
            setMax,
            handleInputChange,
            openModal,
        };
    },
});
</script>

<style scoped>
.asset-input {
    display: flex;
    height: 58px;
    border: 1px solid var(--border);
    border-radius: var(--border-radius-medium);
    background: var(--background-control);
}

.asset-wrapper {
    width: 140px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 5px 0 5px rgba(0, 0, 0, 0.05);
    cursor: pointer;
}

.asset-wrapper:hover {
    background: var(--background-primary);
    border-radius: var(--border-radius-medium);
    border-bottom-right-radius: 0;
    border-top-right-radius: 0;
}

.asset-meta {
    display: flex;
    align-items: center;
}

.asset-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    margin-left: 10px;
    background-color: white;
}

.asset-symbol {
    display: block;
    max-width: 68px;
    margin-left: 8px;
    font-size: var(--font-size-large);
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.amount-wrapper {
    width: 210px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-left: 1px solid var(--border);
}

.amount {
    width: 100%;
}

.input-wrapper {
    display: flex;
}

.balance-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.loading {
    width: 100px;
    height: 29px;
    background: var(--text-primary);
    animation-name: pulse;
    animation-duration: 2s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
}

@keyframes pulse {
    0% {
        opacity: 0.2;
    }

    10% {
        opacity: 0.7;
    }

    100% {
        opacity: 0.2;
    }
}

.input {
    min-width: 120px;
    margin: 0;
    padding: 0;
    font-size: var(--font-size-large);
    font-weight: bold;
    color: var(--text-primary);
    border: none;
    background: transparent;
    text-align: left;
    outline: none;
}

.input::placeholder {
    color: var(--text-secondary);
}

.max-button {
    display: flex;
}

.label {
    margin-top: 4px;
    font-size: var(--font-size-tiny);
    color: var(--text-secondary);
}

.label.warning {
    color: var(--warning);
    font-weight: bold;
}

.label.error {
    color: var(--error);
    font-weight: bold;
}

.chevron-icon {
    width: 12px;
    height: 12px;
    margin-right: 12px;
    margin-bottom: 12px;
}

@media only screen and (max-width: 768px) {
    .amount-wrapper {
        width: 180px;
    }

    .input {
        min-width: 100px;
    }
}
</style>
