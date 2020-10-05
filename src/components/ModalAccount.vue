<template>
    <ModalBase
        :title="'Account'"
        @close="close"
    >
        <template #default>
            <div class="address">
                Address: {{ address }}
                <ButtonText
                    :text="'disconnect'"
                    @click="disconnect"
                />
            </div>
            <div class="balances">
                <div class="balances-header">
                    Balances
                </div>
                <div
                    v-for="balance in balances"
                    :key="balance.address"
                    class="balance"
                >
                    <div class="asset-meta">
                        <div class="asset-icon" />
                        <div class="asset-name">
                            {{ balance.name }}
                        </div>
                        <div class="asset-symbol">
                            {{ balance.symbol }}
                        </div>
                    </div>
                    <div class="asset-amount">
                        {{ balance.amount }}
                    </div>
                </div>
            </div>
        </template>
    </ModalBase>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import { scale } from '@/utils/helpers';
import { formatAddress } from '@/utils/helpers';

import ButtonText from '@/components/ButtonText.vue';
import ModalBase from '@/components/ModalBase.vue';

export default defineComponent({
    components: {
        ButtonText,
        ModalBase,
    },
    setup() {
        const store = useStore();
        const { metadata } = store.state.assets;
        const { address, balances } = store.state.account;

        const accountBalances = computed(() => {
            return Object.keys(balances)
                .map(assetAddress => {
                    const assetMetadata = metadata[assetAddress];
                    const { address, name, symbol, decimals, precision } = assetMetadata;
                    const balance = balances[address] || '0';
                    const balanceNumber = new BigNumber(balance);
                    const amountNumber = scale(balanceNumber, -decimals);
                    const amount = amountNumber.isZero()
                        ? ''
                        : amountNumber.toFixed(precision);
                    return {
                        address,
                        name,
                        symbol,
                        amount,
                    };
                }).
                filter(balance => balance.amount !== '');
        });

        function disconnect(): void {
            close();
            store.dispatch('account/disconnect');
        }

        function close(): void {
            store.dispatch('ui/closeAccountModal');
        }

        return {
            address: formatAddress(address),
            balances: accountBalances,
            disconnect,
            close,
        };
    },
});
</script>

<style scoped>
.address {
    margin: 16px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
}

.balances {
    margin: 32px 0 16px 0;
}

.balances-header {
    display: flex;
    justify-content: center;
}

.balance {
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
}

.asset-meta {
    display: flex;
}

.asset-icon {
    width: 20px;
    height: 20px;
    box-sizing: border-box;
    border: 1px solid white;
    border-radius: 50%;
}

.asset-name {
    max-width: 180px;
    padding-left: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.asset-symbol {
    padding-left: 8px;
    color: var(--text-secondary);
}
</style>
