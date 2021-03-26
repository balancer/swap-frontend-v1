<template>
    <a
        href="https://docs.balancer.finance/core-concepts/bal-balancer-governance-token/bal-for-gas"
        target="_blank"
        class="message-link"
    >
        <div 
            v-if="isActive()" 
            class="message"
        >
            <div>
                <span class="header">
                    High gas fees? Here's a helping hand<br>
                </span>
                <span class="body">
                    {{ text }}
                </span>
            </div>
        </div>
    </a>
</template>

<script lang="ts">

import { PropType, defineComponent, computed } from 'vue';
import { useStore } from 'vuex';
import { Swap, Pool } from '@balancer-labs/sor/dist/types';
import { RootState } from '@/store';
import { ETH_KEY } from '@/utils/helpers';
import config from '@/config';
import BigNumber from 'bignumber.js';

import eligibleAssetList from '@balancer-labs/assets/lists/eligible.json';

export default defineComponent({
    props: {
        addressIn: {
            type: String,
            required: true,
        },
        addressOut: {
            type: String,
            required: true,
        },
        swaps: {
            type: Array as PropType<Swap[][]>,
            required: true,
        },
        pools: {
            type: Array as PropType<Pool[]>,
            required: true,
        },
        active: {
            type: Boolean,
            required: false,
            default: true,
        },
    },

    setup(props) {
        const store = useStore<RootState>();

        const eligibleAssetMeta = eligibleAssetList[config.network];
        const eligibleAssets = Object.fromEntries(Object.entries(eligibleAssetMeta).map(assetEntry => {
            const [address] = assetEntry;
            return [address.toLowerCase(), ''];
        }));

        const reimburseAmount = computed(() => {
            const ethPrice = store.state.price.prices['ethereum'];
            const balPrice = store.state.price.prices['balancer'];
            const gasPrice = store.state.gas.price;

            const eligibleSwaps = props.swaps.flat().filter(hop => {
                return hop.tokenIn in eligibleAssets && hop.tokenOut in eligibleAssets;
            });
            
            const addressInIsEligible = (props.addressIn === ETH_KEY || props.addressIn.toLowerCase() in eligibleAssets);
            const addressOutIsEligible = (props.addressOut === ETH_KEY || props.addressOut.toLowerCase() in eligibleAssets);
            const reimburseAllSwaps = addressInIsEligible && addressOutIsEligible;
            const numSwaps = reimburseAllSwaps ? props.swaps.flat().length : eligibleSwaps.length;
            const gasLimit = numSwaps === 1 ? 130000 :
                numSwaps === 2 ? 220000 :
                    numSwaps === 3 ? 300000 :
                        numSwaps >= 4 ? 400000 : 0;
            const gasLimitNumber = new BigNumber(gasLimit);
            const gasCostWei = gasLimitNumber.times(gasPrice);
            const gasCost = gasCostWei.div(1e18);
            return {
                bal: gasCost.times(ethPrice).div(balPrice),
                usd: gasCost.times(ethPrice),
            };
        });

        const text = computed(() => {
            const isEligible = reimburseAmount.value && reimburseAmount.value.usd.gt(0);
            return isEligible
                ? `This trade earns you ~${reimburseAmount.value.bal.toFixed(1, BigNumber.ROUND_DOWN)} BAL (${formatUSD(reimburseAmount.value.usd)})`
                : 'Earn BAL when swapping eligible tokens';
        });

        function formatUSD(amount: BigNumber): string {
            return `$${new BigNumber(amount).toFixed(2)}`;
        }

        function isActive(): boolean {
            return config.chainId === 1 && store.state.bal4gas.bal4gas === 1;
        }

        return {
            text,
            isActive,
        };
    },
});
</script>

<style scoped>
.message-link {
    text-decoration: none;
}

.message {
    position: relative;
    padding: 20px 30px;
    border-radius: var(--border-radius-medium);
    color: var(--text-primary);
    background: linear-gradient(185deg, #f0f 0%, #00f 100%);
}

.message::before {
    content: '🤝';
    position: absolute;
    top: 2px;
    left: 2px;
    bottom: 2px;
    right: 2px;
    padding: 20px;
    border-radius: var(--border-radius-medium);
    text-align: left;
    font-size: 32px;
    background: var(--background-control);
}

.header {
    font-size: var(--font-size-medium);
    font-weight: bold;
    color: var(--text-primary);
}

.body {
    color: var(--text-secondary);
    font-size: var(--font-size-small);
}

.header,
.body {
    margin-left: 36px;
    position: relative;
}

@media only screen and (max-width: 768px) {
    .message {
        width: initial;
    }
}
</style>
