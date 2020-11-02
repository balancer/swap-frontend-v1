<template>
    <ModalBase
        :title="'Select Asset'"
        @close="close"
    >
        <template #header>
            <div class="query-input-wrapper">
                <input
                    ref="queryEl"
                    v-model="query"
                    class="query-input"
                    placeholder="Search by symbol, name, or address"
                >
            </div>
        </template>
        <template #default>
            <div
                v-for="asset in visibleAssets"
                :key="asset.address"
                class="asset"
                @click="select(asset.address)"
            >   
                <div class="asset-meta">
                    <AssetIcon
                        class="asset-icon"
                        :address="asset.address"
                    />
                    <div class="asset-name">
                        {{ asset.name }}
                    </div>
                    <div class="asset-symbol">
                        {{ asset.symbol }}
                    </div>
                </div>
                <div class="asset-amount">
                    {{ asset.amount }}
                </div>
            </div>
        </template>
    </ModalBase>
</template>

<script lang="ts">
import { getAddress } from '@ethersproject/address';
import BigNumber from 'bignumber.js';
import { defineComponent, onMounted, watch, computed, ref } from 'vue';
import { useStore } from 'vuex';

import { isAddress, scale } from '@/utils/helpers';
import { RootState } from '@/store';

import AssetIcon from '@/components/AssetIcon.vue';
import ModalBase from '@/components/ModalBase.vue';

export default defineComponent({
    components: {
        AssetIcon,
        ModalBase,
    },
    emits: ['select'],
    setup(props, { emit }) {
        const store = useStore<RootState>();
        const { metadata } = store.state.assets;
        const { balances } = store.state.account;

        const query = ref('');
        const queryEl = ref(null);

        onMounted(() => {
            // @ts-ignore
            queryEl.value.focus();
        });

        watch(query, () => {
            if (!isAddress(query.value)) {
                return;
            }
            const address = getAddress(query.value);
            const asset = metadata[address];
            if (!asset) {
                store.dispatch('assets/fetch', [address]);
                store.dispatch('account/fetchAssets', [address]);
            }
        });

        const assets = computed(() => {
            const assets = Object.keys(metadata)
                .map(assetAddress => {
                    const asset = metadata[assetAddress];
                    const { address, name, symbol, decimals, precision } = asset;
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
                });

            const ownedAssets = assets.filter(asset => asset.amount);
            const notOwnedAssets = assets.filter(asset => !asset.amount);
            return [...ownedAssets, ...notOwnedAssets];
        });

        const visibleAssets = computed(() => {
            return assets.value
                .filter(asset => {
                    const queryString = query.value.toLowerCase();
                    if (!queryString) {
                        return true;
                    }
                    if (isAddress(queryString)) {
                        return asset.address.toLowerCase() === queryString;
                    }
                    if (asset.name.toLowerCase().includes(queryString)) {
                        return true;
                    }
                    if (asset.symbol.toLowerCase().includes(queryString)) {
                        return true;
                    }
                });
        });

        function select(assetAddress: string): void {
            emit('select', assetAddress);
            close();
        }

        function close(): void {
            store.dispatch('ui/closeAssetModal');
        }

        return {
            query,
            queryEl,
            visibleAssets,
            select,
            close,
        };
    },
});
</script>

<style scoped>
.query-input-wrapper {
    margin-top: 16px;
}

.query-input {
    width: 100%;
    font-size: 16px;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    outline: none;
}

.asset {
    display: flex;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--outline);
    cursor: pointer;
}

.asset:hover {
    background: var(--outline);
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
