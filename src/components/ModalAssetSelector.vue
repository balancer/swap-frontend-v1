<template>
    <ModalBase
        :title="'Select Asset'"
        :open="open"
        @close="close"
    >
        <template #default>
            <div class="query-input-wrapper">
                <input
                    v-model="query"
                    v-autofocus
                    class="query-input"
                    placeholder="Search by symbol, name, or address"
                >
            </div>
            <div
                v-for="asset in visibleAssets"
                :key="asset.address"
                class="asset"
                :class="{ incompatible: isIncompatible(asset.address) }"
                @click="select(asset.address)"
            >   
                <div class="asset-meta">
                    <AssetIcon
                        class="asset-icon"
                        :address="asset.address"
                    />
                    <div class="asset-symbol">
                        {{ asset.symbol }}
                    </div>
                    <div
                        v-if="isIncompatible(asset.address)"
                        class="asset-incompatible"
                    >
                        Incompatible
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
import { defineComponent, watch, computed, ref } from 'vue';
import { useStore } from 'vuex';

import { isAddress, scale } from '@/utils/helpers';
import { RootState } from '@/store';
import config from '@/config';

import AssetIcon from '@/components/AssetIcon.vue';
import ModalBase from '@/components/ModalBase.vue';

export default defineComponent({
    components: {
        AssetIcon,
        ModalBase,
    },
    props: {
        open: {
            type: Boolean,
            required: true,
        },
        hidden: {
            type: Array,
            default: (): any[] => [],
        },
    },
    emits: ['select'],
    setup(props, { emit }) {
        const store = useStore<RootState>();

        const query = ref('');

        watch(query, () => {
            const metadata = store.getters['assets/metadata'];
            if (!isAddress(query.value)) {
                return;
            }
            const address = getAddress(query.value);
            const asset = metadata[address];
            if (!asset) {
                store.dispatch('assets/fetchMetadata', [address]);
                store.dispatch('account/fetchAssets', [address]);
            }
        });

        const assets = computed(() => {
            const { balances } = store.state.account;
            const metadata = store.getters['assets/metadata'];
            const assets = Object.keys(metadata)
                .map(assetAddress => {
                    const asset = metadata[assetAddress];
                    const { address, name, symbol, decimals } = asset;
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
                });

            const ownedAssets = assets.filter(asset => asset.amount);
            const notOwnedAssets = assets.filter(asset => !asset.amount);
            return [...ownedAssets, ...notOwnedAssets];
        });

        const visibleAssets = computed(() => {
            return assets.value
                .filter(asset => {
                    // Filter by "hidden" prop
                    if (props.hidden.includes(asset.address)) {
                        return false;
                    }
                    // Filter by query
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
                    return false;
                });
        });

        function select(assetAddress: string): void {
            if (isIncompatible(assetAddress)) {
                return;
            }
            emit('select', assetAddress);
            close();
        }

        function close(): void {
            query.value = '';
            store.dispatch('ui/closeAssetModal');
        }

        function isIncompatible(assetAddress: string): boolean {
            return config.untrusted.includes(assetAddress);
        }

        return {
            query,
            visibleAssets,
            select,
            close,
            isIncompatible,
        };
    },
});
</script>

<style scoped>
.query-input-wrapper {
    padding: 16px;
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
    border-bottom: 1px solid var(--border-input);
    cursor: pointer;
}

.asset.incompatible {
    cursor: not-allowed;
}

.asset:hover {
    background: var(--border-input);
}

.asset.incompatible:hover {
    background: transparent;
}

.asset-meta {
    display: flex;
    align-items: center;
}

.asset-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
}

.asset-symbol {
    max-width: 140px;
    padding-left: 12px;
    font-size: var(--font-size-large);
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.asset-incompatible {
    padding-left: 8px;
    color: var(--error);
}

.asset-amount {
    display: flex;
    align-items: center;
    color: var(--text-secondary);
    font-size: var(--font-size-large);
}
</style>
