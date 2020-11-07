<template>
    <div class="popup-wrapper">
        <div class="icon-wrapper">
            <Icon
                class="icon"
                :title="'info'"
            />
        </div>
        <div class="popup">
            <div class="header">
                Multihop swap ({{ routeCount }} routes, {{ hopCount }} hops)
            </div>
            <div
                v-for="(route, index) in routes"
                :key="index"
                class="route"
            >
                <div class="route-share">
                    {{ formatShare(route.share) }}
                </div>
                <div
                    v-for="asset in route.assets"
                    :key="asset.address"
                    class="asset"
                >
                    <AssetIcon
                        :address="asset.address"
                        class="asset-icon"
                    />
                    <div
                        class="asset-symbol"
                    >
                        {{ asset.symbol }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { BigNumber } from 'bignumber.js';
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';
import { getAddress } from '@ethersproject/address';
import { Swap } from '@balancer-labs/sor/dist/types';

import { formatAddress } from '@/utils/helpers';
import { RootState } from '@/store';

import AssetIcon from '@/components/AssetIcon.vue';
import Icon from '@/components/Icon.vue';

interface Asset {
    symbol: string;
    address: string;
}

interface Route {
    share: number;
    assets: Asset[];
}

export default defineComponent({
    components: {
        AssetIcon,
        Icon,
    },
    props: {
        swaps: {
            type: Array,
            required: true,
        },
    },
    setup(props) {
        const store = useStore<RootState>();

        const routeCount = computed(() => props.swaps.length);

        const hopCount = computed(() => {
            const swaps = props.swaps as Swap[][];
            return swaps.reduce((hopCount, route) => {
                return hopCount + route.length;
            }, 0);
        });

        const routes = computed(() => {
            const swaps = props.swaps as Swap[][];
            const { metadata } = store.state.assets;

            const totalSwapAmount = swaps.reduce((swapAmount, route) => {
                return swapAmount.plus(route[0].swapAmount || '0');
            }, new BigNumber(0));

            return swaps.map(route => {
                const assets: Asset[] = [];
                for (let i = 0; i < route.length; i++) {
                    const hop = route[i];
                    if (i === 0) {
                        const { tokenIn } = hop;
                        const address = getAddress(tokenIn);
                        const tokenInMetadata = metadata[address];
                        const symbol = tokenInMetadata
                            ? tokenInMetadata.symbol
                            : formatAddress(address, 4);
                        assets.push({
                            address,
                            symbol,
                        });
                    }
                    const { tokenOut } = hop;
                    const address = getAddress(tokenOut);
                    const tokenOutMetadata = metadata[address];
                    const symbol = tokenOutMetadata
                        ? tokenOutMetadata.symbol
                        : formatAddress(address, 4);
                    assets.push({
                        address,
                        symbol,
                    });
                }
                const swapAmount = new BigNumber(route[0].swapAmount || '0');
                const share = swapAmount.div(totalSwapAmount);
                return {
                    assets,
                    share,
                };
            });
        });

        function formatShare(share: BigNumber): string {
            return `${share.times(100).toFixed(0, BigNumber.ROUND_HALF_UP)}%`;
        }

        return {
            routeCount,
            hopCount,
            routes,
            formatShare,
            formatAddress,
        };
    },
});
</script>

<style scoped>
.popup-wrapper {
    position: relative;
}

.icon-wrapper {
    height: 16px;
}

.icon {
    width: 16px;
    height: 16px;
}

.popup {
    width: 280px;
    z-index: 1;
    bottom: 100%;
    left: 50%;
    margin-left: -149px;
    margin-bottom: 8px;
    padding: 8px;
    position: absolute;
    display: flex;
    flex-direction: column;
    visibility: hidden;
    opacity: 0;
    color: var(--text-primary);
    border: 1px solid var(--outline);
    background-color: var(--background-secondary);
    border-radius: var(--border-radius);
    transition: opacity 0.125s ease-in, visibility 0.125s ease-in;
}

.popup:hover {
    visibility: visible;
    opacity: 1;
}

.popup::before {
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -8px;
    content: "";
    border-style: solid;
    border-color: var(--outline) transparent transparent transparent;
    border-width: 8px;
}

.popup::after {
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -7px;
    content: "";
    border-style: solid;
    border-color: var(--background-secondary) transparent transparent transparent;
    border-width: 7px;
}

.header {
    margin-bottom: 16px;
    color: var(--text-secondary);
    font-size: 14px;
    text-align: center;
}

.icon-wrapper:hover + .popup {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.125s ease-out, visibility 0.125s ease-out;
}

.route {
    display: flex;
}

.route:not(:last-child) {
    margin-bottom: 4px;
}

.route-share {
    width: 40px;
}

.asset {
    display: flex;
}

.asset:not(:last-child)::after {
    content: '⭢';
    margin: 0 4px;
}

.asset-icon {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 4px;
}

.asset-symbol {
    max-width: 60px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
