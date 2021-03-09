<template>
    <div class="message">
        <div>
            <span class="header">
                High gas fees? We'll refund you!<br>
            </span>
            <span class="body">
                {{ text }}
            </span>
        </div>
    </div>
</template>

<script lang="ts">

import { PropType, defineComponent, computed } from 'vue';
import { useStore } from 'vuex';
import { Swap, Pool } from '@balancer-labs/sor/dist/types';
import { RootState } from '@/store';
import BigNumber from 'bignumber.js';

// eslint-disable-next-line no-undef
const GAS_PRICE = process.env.APP_GAS_PRICE || '100000000000';

export default defineComponent({
    props: {
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

        const reimburseAmount = computed(() => {
            const ethPrice = store.state.price.prices['ethereum'];
            const eligibleTokensList = store.getters['assets/eligibleTokensList'];
            const totalSwaps = props.swaps.flat().filter(hop => {
                return hop.tokenIn in eligibleTokensList && hop.tokenOut in eligibleTokensList;
            });

            const numSwaps = totalSwaps.length;
            const gasLimit = new BigNumber((numSwaps === 1 ? 130000 :
                numSwaps === 2 ? 220000 :
                    numSwaps === 3 ? 300000 :
                        numSwaps >= 4 ? 400000 : 0));
            const gasPriceWei = gasLimit.times(GAS_PRICE);
            const gasPrice = gasPriceWei.div(1e18);
            const gasPriceUSD = gasPrice.times(ethPrice);
            return gasPriceUSD;
        });

        const text = computed(() => {
            const isEligible = reimburseAmount.value && reimburseAmount.value.gt(0);
            return isEligible
                ? `Trade will earn you up ~${formatUSD(reimburseAmount.value)} of BAL`
                : 'Earn BAL when swapping eligible tokens';
        });

        function formatUSD(amount: BigNumber): string {
            return `$${new BigNumber(amount).toFixed(2)}`;
        }

        return {
            text,
        };
    },
});
</script>

<style scoped>
.message {
    position: relative;
    margin: 40px 0 0;
    padding: 20px 40px;
    border-radius: var(--border-radius-medium);
    color: var(--text-primary);
    background: linear-gradient(185deg, #f0f 0%, #00f 100%);
}

.message::before {
    content: '👏';
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

.body {
    color: var(--text-secondary);
    font-size: var(--font-size-small);
}

.header,
.body {
    margin-left: 32px;
    position: relative;
}

@media only screen and (max-width: 768px) {
    .message {
        width: initial;
    }
}
</style>
