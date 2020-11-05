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
                v-for="(route, index) in swaps"
                :key="index"
                class="route"
            >
                <div class="route-share">
                    {{ getShare(route) }}%
                </div>
                <div
                    v-for="hop in route"
                    :key="hop"
                    class="hop"
                >
                    <a
                        :href="getPoolLink(hop.pool)"
                        target="_blank"
                        class="pool-link"
                    >
                        {{ formatAddress(hop.pool) }}
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { Swap } from '@balancer-labs/sor/dist/types';

import { formatAddress, getPoolLink } from '@/utils/helpers';

import Icon from '@/components/Icon.vue';
import { BigNumber } from 'bignumber.js';

interface Route {
    distribution: number;
    tokens: string[];
}

export default defineComponent({
    components: {
        Icon,
    },
    props: {
        swaps: {
            type: Array,
            required: true,
        },
    },
    setup(props) {
        const routeCount = computed(() => props.swaps.length);

        const hopCount = computed(() => {
            const swaps = props.swaps as Swap[][];
            return swaps.reduce((hopCount, route) => {
                return hopCount + route.length;
            }, 0);
        });

        const totalSwapAmount = computed(() => {
            const swaps = props.swaps as Swap[][];
            return swaps.reduce((swapAmount, route) => {
                return swapAmount.plus(route[0].swapAmount || '0');
            }, new BigNumber(0));
        });

        function getShare(route: Swap[]): string {
            const swapAmount = new BigNumber(route[0].swapAmount || '0');
            return swapAmount.div(totalSwapAmount.value).times(100).toFixed(0, BigNumber.ROUND_HALF_UP);
        }

        return {
            routeCount,
            hopCount,
            getShare,
            formatAddress,
            getPoolLink,
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
    width: 240px;
    z-index: 1;
    bottom: 100%;
    left: 50%;
    margin-left: -129px;
    margin-bottom: 8px;
    padding: 8px;
    position: absolute;
    display: flex;
    flex-direction: column;
    visibility: hidden;
    color: var(--text-secondary);
    border: 1px solid var(--outline);
    background-color: var(--background-secondary);
    border-radius: var(--border-radius);
}

.popup:hover {
    visibility: visible;
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
    font-size: 14px;
    text-align: center;
}

.icon-wrapper:hover + .popup {
    visibility: visible;
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

.hop:not(:last-child)::after {
    content: '⭢';
    margin: 0 4px;
}

.pool-link {
    color: var(--text-primary);
}
</style>
