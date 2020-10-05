<template>
    <div class="modal-wrapper">
        <div
            class="backdrop"
            @click="close"
        />
        <div class="modal modal-account">
            <div class="header">
                <div>
                    Account
                </div>
                <img
                    :src="closeIcon"
                    class="close-icon"
                    @click="close"
                >
            </div>
            <div class="body">
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
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import closeIcon from '@/assets/closeIcon.svg';

import { scale } from '@/utils/helpers';
import { formatAddress } from '@/utils/helpers';

import ButtonText from '@/components/ButtonText.vue';

export default defineComponent({
    components: {
        ButtonText,
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
            closeIcon,
            address: formatAddress(address),
            balances: accountBalances,
            disconnect,
            close,
        };
    },
});
</script>

<style scoped>
.modal-wrapper {
    position: fixed;
    display: flex;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    align-items: center;
    justify-content: center;
    z-index: 1;
}

.backdrop {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
    background: rgba(0, 0, 0, 0.4);
}

.modal {
    max-height: 90%;
    z-index: 3;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--background-secondary);
    border-radius: var(--border-radius);
    border: 1px solid var(--outline);
}

.modal-account {
    width: 440px;
}

.header {
    display: flex;
    justify-content: space-between;
    padding: 16px;
    font-weight: 700;
    border-bottom: 1px solid var(--outline);
}

.close-icon {
    width: 20px;
    height: 20px;
}

.body {
    overflow-y: auto;
}

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
