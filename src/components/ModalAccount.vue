<template>
    <ModalBase
        :title="'Account'"
        :open="open"
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
                            <div
                                class="account-wallet-icon"
                            >
                                <Icon
                                    :title="'clipboard'"
                                    @click="copyAddress"
                                />
                            </div>
                            <a
                                class="account-link account-wallet-icon"
                                :href="getAccountLink(address)"
                                target="_blank"
                            >
                                <Icon
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
            <div class="wallet">
                <div class="wallet-header">
                    Wallet
                </div>
                <div
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
                        <div class="balance-asset">
                            <div class="asset-icon-wrapper">
                                <AssetIcon
                                    class="asset-icon"
                                    :address="balance.address"
                                />
                            </div>
                            <div class="asset-meta">
                                <div class="asset-name">
                                    {{ balance.name }}
                                </div>
                                <div class="asset-symbol">
                                    {{ balance.symbol }}
                                </div>
                            </div>
                        </div>
                        <div class="balance-amount">
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
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';
import { scale } from '@/utils/helpers';
import { formatAddress, getAccountLink } from '@/utils/helpers';
import config from '@/config';

import AssetIcon from '@/components/AssetIcon.vue';
import ButtonText from '@/components/ButtonText.vue';
import Icon from '@/components/Icon.vue';
import Jazzicon from '@/components/Jazzicon.vue';
import ModalBase from '@/components/ModalBase.vue';

export default defineComponent({
    components: {
        AssetIcon,
        ButtonText,
        Icon,
        Jazzicon,
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

        const connector = computed(() => store.state.account.connector);

        const address = computed(() => store.state.account.address);

        const balances = computed(() => {
            const metadata = store.getters['assets/metadata'];
            const { balances } = store.state.account;
            return Object.keys(balances)
                .map(assetAddress => {
                    const assetMetadata = metadata[assetAddress];
                    const { address, name, symbol, decimals } = assetMetadata;
                    const balance = balances[address] || '0';
                    const balanceNumber = new BigNumber(balance);
                    const amountNumber = scale(balanceNumber, -decimals);
                    const amount = amountNumber.isZero()
                        ? ''
                        : amountNumber.toFixed(config.precision);
                    return {
                        address,
                        name,
                        symbol,
                        amount,
                    };
                }).
                filter(balance => balance.amount !== '');
        });

        function copyAddress(): void {
            const { address } = store.state.account;
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
            balances,

            formatAddress,
            getAccountLink,

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
    color: var(--text-primary);
    cursor: pointer;
}

.connector-name {
    color: var(--text-secondary);
    font-size: 14px;
}

.wallet {
    margin: 16px;
    border: 1px solid var(--border);
    border-radius: var(--border-radius-medium);
}

.wallet-header {
    margin: 16px;
    font-weight: bold;
    font-size: var(--font-size-large);
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

.balance-asset {
    display: flex;
}

.asset-icon-wrapper {
    height: 100%;
    display: flex;
    align-items: center;
}

.asset-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: white;
}

.asset-meta {
    display: flex;
    flex-direction: column;
    margin-left: 16px;
}

.asset-symbol {
    font-size: 14px;
    color: var(--text-secondary);
}

.balance-amount {
    display: flex;
    align-items: center;
    color: var(--text-secondary);
}
</style>
