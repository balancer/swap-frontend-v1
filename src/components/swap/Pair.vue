<template>
    <div>
        <AssetInput
            :address="addressIn"
            :amount="amountIn"
            :modal-key="'input'"
            :loading="swapsLoading && !isExactIn"
            @change="value => {
                handleAmountChange(true, value);
            }"
        />
    </div>
    <div class="rate-wrapper">
        <div class="icon-wrapper">
            <Icon
                class="icon"
                :title="'chevron'"
                @click="toggle"
            />
        </div>
        <div class="rate-message">
            <span
                class="rate-label"
                @click="toggleRate"
            >
                {{ rateMessage }}
            </span>
        </div>
    </div>
    <div>
        <AssetInput
            :address="addressOut"
            :amount="amountOut"
            :modal-key="'output'"
            :loading="swapsLoading && isExactIn"
            @change="value => {
                handleAmountChange(false, value);
            }"
        />
    </div>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { PropType, ref, defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';
import config from '@/config';
import { SwapValidation } from '@/utils/validation';

import AssetInput from '@/components/AssetInput.vue';
import Icon from '@/components/Icon.vue';

export default defineComponent({
    components: {
        AssetInput,
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
        isExactIn: {
            type: Boolean,
            required: true,
        },
        swapsLoading: {
            type: Boolean,
            required: true,
        },
        validation: {
            type: Number as PropType<SwapValidation>,
            required: true,
        },
    },
    emits: [
        'update:address-in',
        'update:amount-in',
        'update:address-out',
        'update:amount-out',
        'update:is-exact-in',
        'change',
    ],
    setup(props, { emit }) {
        const store = useStore<RootState>();

        const isInRate = ref(true);

        const rateMessage = computed(() => {
            if (props.validation === SwapValidation.EMPTY_INPUT ||
                props.validation === SwapValidation.INVALID_INPUT ||
                props.validation === SwapValidation.NO_SWAPS) {
                return '';
            }
            const metadata = store.getters['assets/metadata'];
            const assetIn = metadata[props.addressIn];
            const assetOut = metadata[props.addressOut];
            if (!assetIn || !assetOut) {
                return '';
            }
            const assetInAmount = new BigNumber(props.amountIn);
            const assetOutAmount = new BigNumber(props.amountOut);
            const rate = isInRate.value
                ? assetOutAmount.div(assetInAmount)
                : assetInAmount.div(assetOutAmount);
            const rateString = rate.toFixed(config.precision);
            return isInRate.value
                ? `1 ${assetIn.symbol} = ${rateString} ${assetOut.symbol}`
                : `1 ${assetOut.symbol} = ${rateString} ${assetIn.symbol}`;
        });


        function handleAmountChange(exactIn: boolean, amount: string): void {
            emit('update:is-exact-in', exactIn);
            emit('change', amount);
            if (exactIn) {
                emit('update:amount-in', amount);
            } else {
                emit('update:amount-out', amount);
            }
        }

        function toggle(): void {
            emit('update:is-exact-in', !props.isExactIn);
            emit('update:address-in', props.addressOut);
            emit('update:amount-in', props.amountOut);
            emit('update:address-out', props.addressIn);
            emit('update:amount-out', props.amountIn);
        }

        function toggleRate(): void {
            isInRate.value = !isInRate.value;
        }

        return {
            handleAmountChange,

            toggle,
            rateMessage,
            toggleRate,
        };
    },
});
</script>

<style scoped>
.label {
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    color: var(--text-secondary);
    font-size: 14px;
}

.rate-wrapper {
    width: 100%;
    margin: 24px 0;
    display: flex;
}

.icon-wrapper {
    width: 44px;
    height: 44px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
    border-radius: 50%;
}

.icon {
    width: 24px;
    height: 24px;
    color: black;
    margin-top: 8px;
    cursor: pointer;
}

.rate-message {
    margin-left: 15px;
    display: flex;
    align-items: center;
    font-size: 14px;
    color: var(--text-secondary);
    cursor: pointer;
}

.rate-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
