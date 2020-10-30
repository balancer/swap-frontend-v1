<template>
    <ModalBase
        :title="'Account'"
        @close="close"
    >
        <template #default>
            <div class="account">
                <div class="account-info">
                    <div>
                        <Jazzicon
                            :address="address"
                            :size="40"
                        />
                    </div>
                    <div class="account-wallet">
                        <div class="account-address">
                            {{ formatAddress(address) }}
                            <Icon
                                class="account-icon"
                                :title="'clipboard'"
                                @click="copyAddress"
                            />
                            <a
                                class="transaction-link"
                                :href="getAccountLink(address)"
                                target="_blank"
                            >
                                <Icon
                                    class="account-icon"
                                    :title="'externalLink'"
                                />
                            </a>
                        </div>
                        <span class="account-connector">{{ walletType }}</span>
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
                        No recent transactions
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
                                <span class="transaction-date">26 Oct, 2020 8:32 AM</span>
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
                        v-if="accountBalances.length === 0"
                        class="balances-empty"
                    >
                        No assets found
                    </div>
                    <div
                        v-for="balance in accountBalances"
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
                        <div class="asset-amount">
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
import { formatAddress, formatTxHash, getEtherscanLink, getAccountLink } from '@/utils/helpers';
import config from '@/config';

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
        const { web3Connector, address, transactions, balances } = store.state.account;

        const activeTab = ref('transactions');

        console.log('modal account, setup', balances);

        const tabs = [{
            id: 'transactions',
            title: 'Recent Transactions',
        }, {
            id: 'wallet',
            title: 'Wallet',
        }];

        const walletType = computed(() => {
            return config.connectors[web3Connector].name;
        });

        const accountBalances = computed(() => {
            console.log('ab computed', balances);
            const b = Object.keys(balances)
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
            console.log('ab computed res', b);
            return b;
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
            walletType,
            address,
            activeTab,
            tabs,
            transactions,
            accountBalances,

            formatAddress,
            formatTxHash,
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
    align-items: center;
}

.account-info {
    display: flex;
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

.account-icon {
    height: 18px;
    width: 18px;
    margin-left: 8px;
    cursor: pointer;
}

.account-connector {
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
