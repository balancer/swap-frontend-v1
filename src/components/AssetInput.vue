<template>
    <div class="input">
        <div class="amount-wrapper">
            <ButtonText
                v-if="isMaxLabelShown"
                :text="'max'"
                class="max-label"
                @click="setMax"
            />
            <span v-else />
            <div
                v-if="loading"
                class="loading"
            />
            <input
                v-else
                :value="amount"
                class="amount"
                placeholder="0"
                @input="handleInputChange($event.target.value)"
            >
        </div>
        <div
            class="asset-wrapper"
            @click="openModal"
        >
            <div class="asset-meta">
                <AssetIcon
                    class="asset-icon"
                    :address="address"
                />
                <span class="asset-symbol">{{ symbol }}</span>
            </div>
            <Icon
                class="chevron-icon"
                :title="'chevron'"
            />
        </div>
    </div>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';
import { ETH_KEY } from '@/utils/assets';
import { scale } from '@/utils/helpers';

import AssetIcon from '@/components/AssetIcon.vue';
import ButtonText from '@/components/ButtonText.vue';
import Icon from '@/components/Icon.vue';

export default defineComponent({
    components: {
        AssetIcon,
        ButtonText,
        Icon,
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
        loading: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['update:amount', 'change'],
    setup(props, { emit }) {
        const store = useStore<RootState>();

        const symbol = computed(() => {
            const assets = store.state.assets.metadata;
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
            const assets = store.state.assets.metadata;
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
            const assets = store.state.assets.metadata;
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
            emit('update:amount', value);
        }

        function openModal(): void {
            store.dispatch('ui/openAssetModal', props.modalKey);
        }

        return {
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
.input {
    display: flex;
    height: 48px;
    border: 1px solid var(--outline);
    border-radius: var(--border-radius);
    background: var(--background-secondary);
}

.amount-wrapper {
    width: 260px;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-right: 1px solid var(--outline);
    border-radius: var(--border-radius);
}

.max-label {
    margin-right: 8px;
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

.amount {
    min-width: 200px;
    font-size: 24px;
    color: var(--text-primary);
    border: none;
    background: transparent;
    text-align: right;
    outline: none;
}

.amount::placeholder {
    color: var(--text-secondary);
}

.asset-wrapper {
    width: 120px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
}

.asset-wrapper:hover {
    background: var(--background-primary);
    border-radius: var(--border-radius);
    border-bottom-left-radius: 0;
    border-top-left-radius: 0;
}

.asset-meta {
    display: flex;
    align-items: center;
}

.asset-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-left: 8px;
}

.asset-symbol {
    max-width: 68px;
    margin-left: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chevron-icon {
    width: 16px;
    height: 16px;
    margin-right: 8px;
}

@media only screen and (max-width: 768px) {
    .amount-wrapper {
        width: 160px;
    }

    .amount {
        min-width: 80px;
    }
}
</style>
