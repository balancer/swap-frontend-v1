<template>
    <div class="input">
        <div class="amount-wrapper">
            <ButtonText
                v-if="modalKey === 'input' && address !== 'ether'"
                :text="'max'"
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
                @input="handleInputChange($event.target.value)"
            >
        </div>
        <div
            class="asset-wrapper"
            @click="openModal"
        >
            <div class="asset-meta">
                <div class="asset-logo" />
                <span class="asset-symbol">{{ symbol }}</span>
            </div>
            <img
                class="chevron-icon"
                :src="chevronIcon"
            >
        </div>
    </div>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import chevronIcon from '@/assets/chevronIcon.svg';

import { scale } from '@/utils/helpers';

import ButtonText from '@/components/ButtonText.vue';

export default defineComponent({
    components: {
        ButtonText,
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
        const store = useStore();

        const symbol = computed(() => {
            const assets = store.state.assets.metadata;
            const asset = assets[props.address];
            if (!asset) {
                return '';
            }
            return asset.symbol;
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
            emit('change');
            emit('update:amount', value);
        }

        function openModal(): void {
            store.dispatch('ui/openAssetModal', props.modalKey);
        }

        return {
            chevronIcon,
            symbol,
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
    height: var(--block-height);
    border: 1px solid var(--outline);
    border-radius: 4px;
    background: var(--background-secondary);
}

.amount-wrapper {
    width: 240px;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-right: 1px solid var(--outline);
    border-radius: 4px;
}

.loading {
    width: 80px;
    height: 21px;
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
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 16px;
    text-align: right;
    outline: none;
}

.asset-wrapper {
    width: 140px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
}

.asset-wrapper:hover {
    background: var(--background-primary);
    border-radius: 0 4px 4px 0;
}

.asset-meta {
    display: flex;
    align-items: center;
}

.asset-logo {
    width: 16px;
    height: 16px;
    box-sizing: border-box;
    margin-left: 8px;
    border: 1px solid white;
    border-radius: 8px;
}

.asset-symbol {
    margin-left: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 88px;
}

.chevron-icon {
    width: 16px;
    height: 16px;
    margin-right: 8px;
}
</style>
