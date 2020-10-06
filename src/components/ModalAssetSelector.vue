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
                v-for="asset in assets"
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
import BigNumber from 'bignumber.js';
import { defineComponent, onMounted, computed, ref } from 'vue';
import { useStore } from 'vuex';

import { isAddress, scale } from '@/utils/helpers';

import AssetIcon from '@/components/AssetIcon.vue';
import ModalBase from '@/components/ModalBase.vue';

export default defineComponent({
    components: {
        AssetIcon,
        ModalBase,
    },
    emits: ['select'],
    setup() {
        const store = useStore();
        const { metadata } = store.state.assets;
        const { balances } = store.state.account;

        const query = ref('');
        const queryEl = ref(null);

        onMounted(() => {
            // @ts-ignore
            queryEl.value.focus();
        });

        const assets = computed(() => {
            return Object.keys(metadata)
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
                })
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
            // @ts-ignore
            this.$emit('select', assetAddress);
            close();
        }

        function close(): void {
            store.dispatch('ui/closeAssetModal');
        }

        return {
            query,
            queryEl,
            assets,
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
