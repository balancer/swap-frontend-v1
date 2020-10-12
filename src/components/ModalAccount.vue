<template>
    <ModalBase
        :title="'Account'"
        @close="close"
    >
        <template #default>
            <div class="address">
                Address: {{ formatAddress(address) }}
                <ButtonText
                    :text="'disconnect'"
                    @click="disconnect"
                />
            </div>
            <div
                v-if="transactions.length > 0"
                class="transactions"
            >
                <div class="transactions-header">
                    Transactions
                </div>
                <div
                    v-for="transaction in transactions"
                    :key="transaction.hash"
                    class="transaction"
                >
                    <div class="transaction-meta">
                        <TransactionIcon
                            class="transaction-icon"
                            :status="transaction.status"
                        />
                        <div class="transaction-hash">
                            {{ formatTxHash(transaction.hash) }}
                        </div>
                    </div>
                    <div class="transaction-link">
                        <a
                            :href="getEtherscanLink(transaction.hash)"
                            target="_blank"
                        >
                            <img :src="externalLinkIcon">
                        </a>
                    </div>
                </div>
            </div>
            <div
                v-if="balances.length > 0"
                class="balances"
            >
                <div class="balances-header">
                    Balances
                </div>
                <div
                    v-for="balance in balances"
                    :key="balance.address"
                    class="balance"
                >
                    <div class="asset-meta">
                        <AssetIcon
                            class="asset-icon"
                            :address="balance.address"
                        />
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

import externalLinkIcon from '@/assets/externalLinkIcon.svg';

import { scale } from '@/utils/helpers';
import { formatAddress, formatTxHash, getEtherscanLink } from '@/utils/helpers';

import AssetIcon from '@/components/AssetIcon.vue';
import ButtonText from '@/components/ButtonText.vue';
import ModalBase from '@/components/ModalBase.vue';
import TransactionIcon from '@/components/TransactionIcon.vue';

export default defineComponent({
    components: {
        AssetIcon,
        ButtonText,
        ModalBase,
        TransactionIcon,
    },
    setup() {
        const store = useStore();
        const { metadata } = store.state.assets;
        const { address, transactions, balances } = store.state.account;

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
            address,
            transactions,
            balances: accountBalances,
            externalLinkIcon,
            formatAddress,
            formatTxHash,
            getEtherscanLink,
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

.transactions {
    margin: 32px 0 16px 0;
}

.transactions-header {
    display: flex;
    justify-content: center;
}

.transaction {
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
}

.transaction-meta {
    display: flex;
}

.transaction-icon {
    width: 20px;
    height: 20px;
}

.transaction-hash {
    margin-left: 8px;
}

.transaction-link > a > img {
    height: 12px;
    width: 12px;
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
    border-radius: 50%;
}

.asset-name {
    max-width: 180px;
    margin-left: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.asset-symbol {
    margin-left: 8px;
    color: var(--text-secondary);
}
</style>
