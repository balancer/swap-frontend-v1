<template>
    <ModalBase
        :title="'Account'"
        @close="close"
    >
        <template #default>
            <div class="account">
                <div class="account-info">
                    <div class="account-icon">
                        <Jazzicon
                            :address="address"
                            :size="40"
                        />
                        <div class="connector-icon-wrapper">
                            <img
                                :src="connector.logo"
                                class="connector-icon"
                            >
                        </div>
                    </div>
                    <div class="account-wallet">
                        <div class="account-address">
                            {{ formatAddress(address) }}
                            <Icon
                                class="account-wallet-icon"
                                :title="'clipboard'"
                                @click="copyAddress"
                            />
                            <a
                                class="transaction-link"
                                :href="getAccountLink(address)"
                                target="_blank"
                            >
                                <Icon
                                    class="account-wallet-icon"
                                    :title="'externalLink'"
                                />
                            </a>
                        </div>
                        <span class="connector-name">{{ connector.name }}</span>
                    </div>
                </div>
                <ButtonText
                    :text="'disconnect'"
                    @click="disconnect"
                />
            </div>
            <div class="state">
                <Toggle
                    :options="tabs"
                    :selected="activeTab"
                    @select="handleToggleSelect"
                />
                <div
                    v-if="activeTab === 'transactions'"
                    class="transactions"
                >
                    <div
                        v-if="transactions.length === 0"
                        class="transactions-empty"
                    >
                        Your transactions will appear here
                    </div>
                    <div
                        v-for="transaction in transactions"
                        :key="transaction.hash"
                        class="transaction"
                    >
                        <div class="transaction-meta">
                            <div class="transaction-icon-wrapper">
                                <TransactionIcon
                                    class="transaction-icon"
                                    :status="transaction.status"
                                />
                            </div>
                            <div class="transaction-data">
                                <span class="transaction-text">{{ transaction.text }}</span>
                                <div class="transaction-date">
                                    <span v-if="transaction.timestamp > 0">{{ formatDate(transaction.timestamp) }}</span>
                                    <span v-else>Mining…</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <a
                                class="transaction-link"
                                :href="getEtherscanLink(transaction.hash)"
                                target="_blank"
                            >
                                <Icon
                                    class="transaction-link-icon"
                                    :title="'externalLink'"
                                />
                            </a>
                        </div>
                    </div>
                </div>
                <div
                    v-if="activeTab === 'wallet'"
                    class="balances"
                >
                    <div
                        v-if="balances.length === 0"
                        class="balances-empty"
                    >
                        Wallet is empty
                    </div>
                    <div
                        v-for="balance in balances"
                        :key="balance.address"
                        class="balance"
                    >
                        <div class="asset-meta">
                            <div class="asset-icon-wrapper">
                                <AssetIcon
                                    class="asset-icon"
                                    :address="balance.address"
                                />
                            </div>
                            <div class="asset-data">
                                <div class="asset-name">
                                    {{ balance.name }}
                                </div>
                                <div class="asset-symbol">
                                    {{ balance.symbol }}
                                </div>
                            </div>
                        </div>
                        <div>
                            {{ balance.amount }}
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </ModalBase>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { defineComponent, ref, computed } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';
import { scale } from '@/utils/helpers';
import { formatAddress, formatTxHash, formatDate, getEtherscanLink, getAccountLink } from '@/utils/helpers';

import AssetIcon from '@/components/AssetIcon.vue';
import ButtonText from '@/components/ButtonText.vue';
import Icon from '@/components/Icon.vue';
import Jazzicon from '@/components/Jazzicon.vue';
import ModalBase from '@/components/ModalBase.vue';
import Toggle from '@/components/Toggle.vue';
import TransactionIcon from '@/components/TransactionIcon.vue';

export default defineComponent({
    components: {
        AssetIcon,
        ButtonText,
        Icon,
        Jazzicon,
        ModalBase,
        Toggle,
        TransactionIcon,
    },
    setup() {
        const store = useStore<RootState>();
        const { metadata } = store.state.assets;
        const { connector, address, transactions, balances } = store.state.account;

        const activeTab = ref('transactions');

        const tabs = [{
            id: 'transactions',
            title: 'Transactions',
        }, {
            id: 'wallet',
            title: 'Wallet',
        }];

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

        function handleToggleSelect(optionId: string): void {
            activeTab.value = optionId;
        }

        function copyAddress(): void {
            navigator.clipboard.writeText(address);
        }

        function disconnect(): void {
            close();
            store.dispatch('account/disconnect');
        }

        function close(): void {
            store.dispatch('ui/closeAccountModal');
        }

        return {
            connector,
            address,
            activeTab,
            tabs,
            transactions,
            balances: accountBalances,

            formatAddress,
            formatTxHash,
            formatDate,
            getEtherscanLink,
            getAccountLink,

            handleToggleSelect,
            copyAddress,
            disconnect,
            close,
        };
    },
});
</script>

<style scoped>
.account {
    margin: 16px;
    display: flex;
    justify-content: space-between;
    align-items: end;
}

.account-info {
    display: flex;
}

.account-icon {
    height: 40px;
    position: relative;
}

.connector-icon-wrapper {
    width: 20px;
    height: 20px;
    position: absolute;
    bottom: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 50%;
}

.connector-icon {
    width: 16px;
    height: 16px;
}

.account-wallet {
    display: flex;
    flex-direction: column;
    margin-left: 16px;
}

.account-address {
    display: flex;
    align-items: center;
    font-size: 20px;
}

.account-wallet-icon {
    height: 18px;
    width: 18px;
    margin-left: 8px;
    cursor: pointer;
}

.connector-name {
    color: var(--text-secondary);
    font-size: 14px;
}

.state {
    margin: 32px 16px 16px 16px;
    border: 1px solid var(--outline);
    border-radius: var(--border-radius);
}

.transactions {
    margin: 16px 0;
}

.transactions-empty {
    text-align: center;
    color: var(--text-secondary);
}

.transaction {
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
}

.transaction-meta {
    display: flex;
}

.transaction-icon-wrapper {
    height: 100%;
    display: flex;
    align-items: center;
}

.transaction-icon {
    width: 24px;
    height: 24px;
}

.transaction-data {
    display: flex;
    flex-direction: column;
    margin-left: 16px;
}

.transaction-date {
    font-size: 14px;
    color: var(--text-secondary);
}

.transaction-link {
    color: var(--text-primary);
}

.transaction-link-icon {
    height: 12px;
    width: 12px;
}

.balances {
    margin: 16px 0;
}

.balances-empty {
    text-align: center;
    color: var(--text-secondary);
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

.asset-icon-wrapper {
    height: 100%;
    display: flex;
    align-items: center;
}

.asset-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
}

.asset-data {
    display: flex;
    flex-direction: column;
    margin-left: 16px;
}

.asset-symbol {
    font-size: 14px;
    color: var(--text-secondary);
}
</style>
