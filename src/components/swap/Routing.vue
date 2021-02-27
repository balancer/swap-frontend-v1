<template>
    <div>
        <div
            class="header"
            @click="toggleVisibility"
        >
            <div>
                View order routing
            </div>
            <Icon
                class="toggle-icon"
                :class="{ flipped: visible }"
                :title="'chevron'"
            />
        </div>
        <div
            v-if="visible"
            class="body"
        >
            <div
                v-if="routes.length === 0"
                class="no-data-label"
            >
                No data available
            </div>
            <div v-else>
                <div class="pair">
                    <div class="pair-amount">
                        <div>
                            <div class="asset-amount">
                                {{ input.amount }}
                            </div>
                            <div>
                                {{ input.symbol }}
                            </div>
                        </div>
                        <div class="output-asset">
                            <div class="asset-amount">
                                {{ output.amount }}
                            </div>
                            <div>
                                {{ output.symbol }}
                            </div>
                        </div>
                    </div>
                    <div class="pair-icon-wrapper">
                        <div class="pair-line" />
                        <div class="pair-icon">
                            <AssetIcon
                                :address="input.address"
                                class="asset-icon"
                            />
                            <AssetIcon
                                :address="output.address"
                                class="asset-icon"
                            />
                        </div>
                    </div>
                </div>
                <div
                    class="arrows"
                    :style="{ margin: `8px ${11 + routes.length}px` }"
                >
                    <Icon
                        :title="'triangle'"
                        class="arrow-icon"
                    />
                    <Icon
                        :title="'triangle'"
                        class="arrow-icon reverted"
                    />
                </div>
                <div class="routes">
                    <div
                        v-for="(route, index) in routes"
                        :key="index"
                        :style="{
                            height: `${18 + 72 * index}px`,
                            width: `calc(100% - ${4 * (routes.length - index - 1)}px - 4px)`,
                            margin: `0 ${2 * (routes.length - index - 1) + 1}px`,
                        }"
                        class="route-line"
                    />
                    <div class="route-wrapper">
                        <div
                            v-for="route in routes"
                            :key="route.hops[0].pool.address"
                            class="route"
                        >
                            <div class="arrow-wrapper">
                                <Icon
                                    :title="'triangle'"
                                    class="arrow-icon horizontal"
                                />
                            </div>
                            <div class="hops">
                                <div
                                    v-for="hop in route.hops"
                                    :key="hop.pool.address"
                                    class="hop"
                                >
                                    <a
                                        :href="getPoolLink(hop.pool.address)"
                                        target="_blank"
                                    >
                                        <AssetIcon
                                            v-for="token in hop.pool.tokens"
                                            :key="token.address"
                                            :address="token.address"
                                            class="asset-icon-small"
                                        />
                                    </a>
                                </div>
                            </div>
                            <div class="share">
                                {{ formatShare(route.share) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { PropType, defineComponent, ref, computed } from 'vue';
import { useStore } from 'vuex';
import { getAddress } from '@ethersproject/address';
import { Swap, Pool } from '@balancer-labs/sor/dist/types';

import { RootState } from '@/store';
import { getPoolLink } from '@/utils/helpers';

import AssetIcon from '@/components/AssetIcon.vue';
import Icon from '@/components/Icon.vue';

interface Route {
    share: number;
    hops: Hop[];
}

interface Hop {
    pool: {
        address: string;
        tokens: Asset[];
    };
    tokenIn: string;
    tokenOut: string;
    swapAmount: string;
}

interface Asset {
    address: string;
    share: number;
}

export default defineComponent({
    components: {
        AssetIcon,
        Icon,
    },
    props: {
        addressIn: {
            type: String,
            required: true,
        },
        amountIn: {
            type: String,
            required: true,
        },
        addressOut: {
            type: String,
            required: true,
        },
        amountOut: {
            type: String,
            required: true,
        },
        pools: {
            type: Array as PropType<Pool[]>,
            required: true,
        },
        swaps: {
            type: Array as PropType<Swap[][]>,
            required: true,
        },
    },
    setup(props) {
        const store = useStore<RootState>();

        const visible = ref(false);

        function toggleVisibility(): void {
            visible.value = !visible.value;
        }

        const input = computed(() => {
            const metadata = store.getters['assets/metadata'];
            const symbol = metadata[props.addressIn].symbol;
            return {
                amount: props.amountIn,
                address: props.addressIn,
                symbol,
            };
        });

        const output = computed(() => {
            const metadata = store.getters['assets/metadata'];
            const symbol = metadata[props.addressOut].symbol;
            return {
                amount: props.amountOut,
                address: props.addressOut,
                symbol,
            };
        });

        const routes = computed(() => {
            const { pools, swaps } = props;

            if (pools.length === 0 || swaps.length === 0) {
                return [];
            }

            const totalSwapAmount = swaps.reduce((total, rawHops) => {
                return total.plus(rawHops[0].swapAmount || '0');
            }, new BigNumber(0));
            const routes = swaps.map(rawHops => {
                const swapAmount = new BigNumber(rawHops[0].swapAmount || '0');
                const share = swapAmount.div(totalSwapAmount).toNumber();
                const hops = rawHops.map(rawHop => {
                    const { swapAmount } = rawHop;
                    const tokenIn = getAddress(rawHop.tokenIn);
                    const tokenOut = getAddress(rawHop.tokenOut);
                    const rawPool = pools.find(pool => pool.id === rawHop.pool);
                    if (!rawPool) {
                        return {};
                    }
                    const totalWeight = new BigNumber(rawPool.totalWeight);
                    const pool = {
                        address: rawPool.id,
                        tokens: rawPool.tokens
                            .map(token => {
                                const address = getAddress(token.address);
                                const weight = new BigNumber(token.denormWeight);
                                const share = weight.div(totalWeight).toNumber();
                                return {
                                    address,
                                    share,
                                };
                            })
                            .sort((a, b) => {
                                if (a.address === tokenIn || b.address === tokenOut) {
                                    return -1;
                                }
                                if (a.address === tokenOut || b.address === tokenIn) {
                                    return 1;
                                }
                                return a.share - b.share;
                            })
                            .filter((token, index, tokens) => {
                                // Show first 2 and last 2 tokens
                                return index < 2 || index > tokens.length - 3;
                            }),
                    };
                    return {
                        pool,
                        tokenIn,
                        tokenOut,
                        swapAmount,
                    };
                });
                return {
                    share,
                    hops,
                };
            }) as Route[];

            return routes;
        });

        function formatShare(share: number): string {
            return `${(share * 100).toFixed(2)}%`;
        }

        return {
            visible,
            toggleVisibility,

            input,
            output,
            routes,

            formatShare,
            getPoolLink,
        };
    },
});
</script>

<style scoped>
div {
    --line-color: #4d4f66;
}

.header {
    display: flex;
    font-size: var(--font-size-medium);
    color: var(--text-secondary);
    align-items: center;
    cursor: pointer;
}

.toggle-icon {
    margin-left: 12px;
    margin-bottom: 12px;
    width: 12px;
    height: 12px;
}

.toggle-icon.flipped {
    margin-bottom: 0;
    margin-top: 12px;
    transform: rotate(180deg);
}

.no-data-label {
    color: var(--text-secondary);
    font-size: var(--font-size-small);
}

.no-data-label,
.body {
    margin-top: 20px;
}

.pair-amount {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-tiny);
}

.asset-amount {
    font-weight: bold;
}

.pair-icon-wrapper {
    position: relative;
    margin-top: 8px;
}

.pair-line {
    position: absolute;
    width: calc(100% - 72px);
    height: 50%;
    margin: 0 36px;
    border-bottom: 1px dashed var(--line-color);
}

.pair-icon {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
}

.asset-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: white;
}

.output-asset {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.arrows {
    display: flex;
    justify-content: space-between;
}

.arrow-icon {
    width: 9px;
    height: 6px;
    transform: rotate(180deg);
    display: flex;
    color: var(--line-color);
}

.arrow-icon.reverted {
    transform: none;
}

.arrow-icon.horizontal {
    width: 6px;
    transform: rotate(90deg);
    margin-top: 1px;
}

.routes {
    position: relative;
    margin: 6px 16px;
}

.route-line {
    position: absolute;
    border-left: 1px solid var(--line-color);
    border-right: 1px solid var(--line-color);
    border-bottom: 1px solid var(--line-color);
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
}

.route-wrapper {
    position: inherit;
    z-index: 1;
}

.route {
    display: flex;
    justify-content: space-between;
}

.route:not(:first-child) {
    margin-top: 36px;
}

.arrow-wrapper {
    width: 42px;
    margin-left: 16px;
    display: flex;
    align-items: center;
}

.hops {
    display: flex;
}

.hop {
    padding: 6px;
    display: flex;
    background: var(--background-primary);
    border-radius: var(--border-radius-small);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hop:not(:first-child) {
    margin-left: 16px;
}

.asset-icon-small {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
}

.asset-icon-small:not(:first-child) {
    margin-left: 6px;
}

.share {
    font-size: var(--font-size-tiny);
    width: 42px;
    margin-right: 16px;
    text-align: right;
}
</style>
