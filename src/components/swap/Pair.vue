<template>
    <div>
        <div class="label">
            <div>
                Send
                <span v-if="!isExactIn">(approximate)</span>
            </div>
            <div class="balance-label">
                {{ assetInBalanceLabel }}
            </div>
        </div>
        <AssetInput
            :address="addressIn"
            :amount="amountIn"
            :modal-key="'input'"
            :loading="swapsLoading && !isExactIn"
            @change="value => {
                handleAmountChange(true, value);
            }"
        />
    </div>
    <Icon
        class="icon"
        :title="'chevron'"
        @click="toggle"
    />
    <div>
        <div class="label">
            <div>
                Receive
                <span v-if="isExactIn">(approximate)</span>
            </div>
            <div class="balance-label">
                {{ assetOutBalanceLabel }}
            </div>
        </div>
        <AssetInput
            :address="addressOut"
            :amount="amountOut"
            :modal-key="'output'"
            :loading="swapsLoading && isExactIn"
            @change="value => {
                handleAmountChange(false, value);
            }"
        />
    </div>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';
import config from '@/config';
import { scale } from '@/utils/helpers';

import AssetInput from '@/components/AssetInput.vue';
import Icon from '@/components/Icon.vue';

export default defineComponent({
    components: {
        AssetInput,
        Icon,
    },
    props: {
        addressIn: {
            type: String,
            required: true,
        },
        amountIn: {
            type: String,
            required: true,
        },
        addressOut: {
            type: String,
            required: true,
        },
        amountOut: {
            type: String,
            required: true,
        },
        isExactIn: {
            type: Boolean,
            required: true,
        },
        swapsLoading: {
            type: Boolean,
            required: true,
        },
    },
    emits: [
        'update:address-in',
        'update:amount-in',
        'update:address-out',
        'update:amount-out',
        'update:is-exact-in',
        'change',
    ],
    setup(props, { emit }) {
        const store = useStore<RootState>();

        const assetInBalanceLabel = computed(() => {
            const { balances } = store.state.account;
            const { metadata } = store.state.assets;
            if (!balances || !metadata) {
                return '';
            }

            const assetMetadata = metadata[props.addressIn];
            const balance = balances[props.addressIn];
            const balanceNumber = new BigNumber(balance);
            if (!assetMetadata || !balance) {
                return '';
            }

            const assetSymbol = assetMetadata.symbol;
            const assetDecimals = assetMetadata.decimals;
            const balanceShortNumber = scale(balanceNumber, -assetDecimals);
            const balanceShort = balanceShortNumber.isInteger()
                ? balanceShortNumber.toString()
                : balanceShortNumber.toFixed(config.precision);
            return `Balance: ${balanceShort} ${assetSymbol}`;
        });

        const assetOutBalanceLabel = computed(() => {
            const { balances } = store.state.account;
            const { metadata } = store.state.assets;

            if (!balances || !metadata) {
                return '';
            }

            const assetMetadata = metadata[props.addressOut];
            const balance = balances[props.addressOut];
            const balanceNumber = new BigNumber(balance);
            if (!assetMetadata || !balance) {
                return '';
            }

            const assetSymbol = assetMetadata.symbol;
            const assetDecimals = assetMetadata.decimals;
            const balanceShortNumber = scale(balanceNumber, -assetDecimals);
            const balanceShort = balanceShortNumber.isInteger()
                ? balanceShortNumber.toString()
                : balanceShortNumber.toFixed(config.precision);
            return `Balance: ${balanceShort} ${assetSymbol}`;
        });

        function handleAmountChange(exactIn: boolean, amount: string): void {
            emit('update:is-exact-in', exactIn);
            emit('change', amount);
            if (exactIn) {
                emit('update:amount-in', amount);
            } else {
                emit('update:amount-out', amount);
            }
        }

        function toggle(): void {
            emit('update:is-exact-in', !props.isExactIn);
            emit('update:address-in', props.addressOut);
            emit('update:amount-in', props.amountOut);
            emit('update:address-out', props.addressIn);
            emit('update:amount-out', props.amountIn);
        }

        return {
            assetInBalanceLabel,
            assetOutBalanceLabel,

            handleAmountChange,
            toggle,
        };
    },
});
</script>

<style scoped>
.label {
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    color: var(--text-secondary);
    font-size: 14px;
}

.balance-label {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.icon {
    width: 24px;
    height: 24px;
    margin-top: 8px;
    cursor: pointer;
}
</style>
