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
                :class="{ incompatible: isIncompatible(asset.address) }"
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
                    <div
                        v-if="isIncompatible(asset.address)"
                        class="asset-incompatible"
                    >
                        Incompatible
                    </div>
                </div>
                <div>
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
import config from '@/config';

import AssetIcon from '@/components/AssetIcon.vue';
import ModalBase from '@/components/ModalBase.vue';

export default defineComponent({
    components: {
        AssetIcon,
        ModalBase,
    },
    props: {
        hidden: {
            type: Array,
            default: (): any[] => [],
        },
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
            store.dispatch('ui/closeAssetModal');
        }

        function isIncompatible(assetAddress: string): boolean {
            return config.untrusted.includes(assetAddress);
        }

        return {
            query,
            queryEl,
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

.asset.incompatible {
    cursor: not-allowed;
}

.asset:hover {
    background: var(--outline);
}

.asset.incompatible:hover {
    background: transparent;
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
    max-width: 140px;
    padding-left: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-secondary);
}

.asset-incompatible {
    padding-left: 8px;
    color: var(--error);
}
</style>
