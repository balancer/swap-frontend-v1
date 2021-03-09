<template>
    <div
        v-if="!isZero"
        class="container"
    >
        <div>
            <img
                class="message-icon"
                :src="handsIcon"
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

import { ref, PropType, defineComponent, watch, computed } from 'vue';
import { useStore } from 'vuex';
import { Swap, Pool } from '@balancer-labs/sor/dist/types';
import { RootState } from '@/store';
import BigNumber from 'bignumber.js';
import { getPrices } from '@/utils/price';
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
        const balReimburseAmount = ref('');
        const balReimburseAmountUSD = ref('');
        const loading = ref(true);

        const isZero = computed(() => {
            return !balReimburseAmountUSD.value ||
                balReimburseAmountUSD.value === '' ||
                parseFloat(balReimburseAmountUSD.value) === 0;
        });

        watch(() => props, async (props) => {
            loading.value = true;

            const prices = await getPrices(['ethereum', 'balancer']);
            const ethPrice = prices['ethereum'];
            const balPrice = prices['balancer'];

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

            const balAmount = gasPrice.div(balPrice);
            balReimburseAmount.value = balAmount.toFixed(2);
            const gasPriceUSD = new BigNumber(ethPrice).times(gasPrice.toString());
            balReimburseAmountUSD.value = gasPriceUSD.toFixed(2);

            loading.value = false;
        },
        {
            deep: true,
            immediate: true,
        },
        );

        const messageGasReimbursed = computed(() => {
            const defaultMessage = 'Earn BAL when swapping eligible tokens!';
            try {
                return loading.value ||
                       (!balReimburseAmount.value || balReimburseAmount.value) === '0' ||
                       (!balReimburseAmountUSD.value || balReimburseAmountUSD.value === '0') ?
                    defaultMessage :
                    `This trade will earn you up ~${formatUSD(balReimburseAmountUSD.value)} of BAL`;
            } catch (e) {
                console.error('error calculating estimate: ', e);
                return defaultMessage;
            }
        });

        function formatUSD(amount: any): string {
            return `$${new BigNumber(amount).toFixed(2)}`; // TODO: check NaN
        }

        const handsIcon = ref(handsClapIcon);

        return {
            loading,
            isZero,
            messageGasReimbursed,
            handsIcon,
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
    width: 385px;
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

.container-loading {
    display: flex;
    align-items: center;
    margin-top: 40px;
    width: 385px;
    padding: 10px;
    border: 3px solid transparent;
    font-size: var(--font-size-small);
    color: var(--text-secondary);
    justify-content: center;
}
</style>
