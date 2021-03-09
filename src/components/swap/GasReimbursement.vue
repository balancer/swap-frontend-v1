<template>
    <div class="container">
        <div>
            <img
                class="message-icon"
                :src="handsClapIcon"
            >
        </div>
        <div>
            <span class="message-title">
                High gas fees? We'll refund you!<br>
            </span>
            <span class="message-body">
                {{ messageGasReimbursed }}
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
import handsClapIcon from '@/assets/handsClapIcon.png';

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

        const messageGasReimbursed = computed(() => {
            const isEligible = reimburseAmount.value && reimburseAmount.value.gt(0);
            return isEligible
                ? `This trade will earn you up ~${formatUSD(reimburseAmount.value)} of BAL`
                : 'Earn BAL when swapping eligible tokens';
        });

        function formatUSD(amount: BigNumber): string {
            return `$${new BigNumber(amount).toFixed(2)}`;
        }

        return {
            messageGasReimbursed,
            handsClapIcon,
        };
    },
});
</script>

<style scoped>

.container {
    display: flex;
    align-items: center;
    background:
        linear-gradient(var(--background-secondary), var(--background-secondary)) padding-box,
        linear-gradient(185deg, #f0f 0%, #00f 100%) border-box;
    border-radius: var(--border-radius-medium);
    margin-top: 40px;
    padding: 10px;
    border: 3px solid transparent;
    font-size: var(--font-size-small);
    color: var(--text-secondary);
}

.message-title {
    font-weight: bold;
    color: var(--text-primary);
}

.message-body {
    font-size: var(--font-size-small);
    color: var(--text-secondary);
    cursor: pointer;
}

.message-icon {
    width: 32px;
    height: 32px;
    margin: 10px 10px;
}
</style>
