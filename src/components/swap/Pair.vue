<template>
    <div>
        <AssetInput
            :address="addressIn"
            :amount="amountIn"
            :label="balanceLabel"
            :modal-key="'input'"
            :loading="swapsLoading && !isExactIn"
            @change="value => {
                handleAmountChange(true, value);
            }"
        />
    </div>
    <div class="rate-wrapper">
        <PairToggle @toggle="toggle" />
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
            :label="slippageLabel"
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
import { scale } from '@/utils/helpers';
import { SwapValidation, ValidationError, validateNumberInput } from '@/utils/validation';

import AssetInput, { LabelStyle } from '@/components/AssetInput.vue';
import PairToggle from '@/components/swap/PairToggle.vue';

const SLIPPAGE_WARNING = 0.02;

export default defineComponent({
    components: {
        AssetInput,
        PairToggle,
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
        slippage: {
            type: Number,
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

        const slippageLabel = computed(() => {
            if (props.slippage === 0) {
                return {
                    text: '',
                    style: LabelStyle.Normal,
                };
            }
            if (props.slippage < 0.0001) {
                return {
                    text: 'Price impact: 0.01%',
                    style: LabelStyle.Normal,
                };
            }
            const text = `Price impact: ${(props.slippage * 100).toFixed(2)}%`;
            const style = props.slippage < SLIPPAGE_WARNING
                ? LabelStyle.Normal
                : LabelStyle.Warning;
            return {
                text,
                style,
            };
        });

        const balanceLabel = computed(() => {
            const { balances } = store.state.account;
            const metadata = store.getters['assets/metadata'];
            if (!balances || !metadata) {
                return {
                    text: '',
                    style: LabelStyle.Normal,
                };
            }

            const assetMetadata = metadata[props.addressIn];
            const balance = balances[props.addressIn];
            if (!assetMetadata || !balance) {
                return {
                    text: '',
                    style: LabelStyle.Normal,
                };
            }

            const balanceNumber = new BigNumber(balance);
            const assetDecimals = assetMetadata.decimals;
            const balanceShortNumber = scale(balanceNumber, -assetDecimals);
            const text = `Balance: ${balanceShortNumber.toFixed(config.precision)}`;
            const error = validateNumberInput(props.amountIn);
            const style = error == ValidationError.NONE && balanceShortNumber.lt(props.amountIn)
                ? LabelStyle.Error
                : LabelStyle.Normal;
            return {
                text,
                style,
            };
        });

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

            balanceLabel,
            slippageLabel,

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
    margin: 24px 0;
    display: flex;
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
    max-width: 320px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
