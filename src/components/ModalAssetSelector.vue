<template>
    <div class="modal-wrapper">
        <div
            class="backdrop"
            @click="close"
        />
        <div class="modal modal-asset">
            <div class="header">
                <div>
                    Select Asset
                </div>
                <img
                    :src="closeIcon"
                    class="close-icon"
                    @click="close"
                >
            </div>
            <div class="body">
                <div
                    v-for="asset in assets"
                    :key="asset.address"
                    class="asset"
                    @click="select(asset.address)"
                >   
                    <div class="asset-meta">
                        <div class="asset-icon" />
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
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import { scale } from '@/utils/helpers';

import closeIcon from '@/assets/closeIcon.svg';

export default defineComponent({
    emits: ['select'],
    setup() {
        const store = useStore();
        const { metadata } = store.state.assets;
        const { balances } = store.state.account;

        const assets = computed(() => {
            return Object.keys(metadata)
                .map(assetAddress => {
                    const asset = metadata[assetAddress];
                    const { address, name, symbol, decimals, precision } = asset;
                    const balance = balances[address];
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
            closeIcon,
            assets,
            select,
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

.modal-asset {
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
