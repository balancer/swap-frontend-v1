<template>
    <Button
        :disabled="disabled"
        :text="text"
        :primary="true"
        :loading="loading"
        @click="handleClick"
    />
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { PropType, defineComponent, toRefs, computed } from 'vue';
import { useStore } from 'vuex';

import config from '@/config';
import { RootState } from '@/store';
import { ETH_KEY, scale } from '@/utils/helpers';
import { SwapValidation } from '@/utils/validation';

import Button from '@/components/Button.vue';

enum Type {
    Connect,
    Unlock,
    Swap,
}

export default defineComponent({
    components: {
        Button,
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
        transactionPending: {
            type: Boolean,
            required: true,
        },
        validation: {
            type: Number as PropType<SwapValidation>,
            required: true,
        },
    },
    emits: ['swap', 'unlock'],
    setup(props, { emit }) {
        const store = useStore<RootState>();

        const { addressIn, addressOut, amountIn, transactionPending, validation } = toRefs(props);

        const account = computed(() => {
            const { connector, address } = store.state.account;
            if (!connector || !connector.id || !address) {
                return '';
            }
            return address;
        });

        const type = computed(() => {
            if (!account.value) {
                return Type.Connect;
            }
            if (!isUnlocked.value) {
                return Type.Unlock;
            } else {
                return Type.Swap;
            }
        });

        const disabled = computed(() => {
            if (type.value === Type.Connect) {
                const { connector, address } = store.state.account;
                return !!connector && !!connector.id && !address;
            } else {
                return validation.value !== SwapValidation.NONE ||
                    transactionPending.value;
            }
        });

        const text = computed(() => {
            if (loading.value) {
                return actionText.value;
            }
            if (disabled.value) {
                return errorText.value;
            } else {
                return actionText.value;
            }
        });

        const loading = computed(() => {
            if (type.value === Type.Connect) {
                const { connector, address } = store.state.account;
                return !!connector && !!connector.id && !address;
            } else {
                return transactionPending.value;
            }
        });

        const errorText = computed(() => {
            if (validation.value === SwapValidation.EMPTY_INPUT) {
                return 'Enter amount';
            }
            if (validation.value === SwapValidation.INVALID_INPUT) {
                return 'Invalid amount';
            }
            if (validation.value === SwapValidation.WRONG_NETWORK) {
                return 'Wrong network';
            }
            if (validation.value === SwapValidation.INSUFFICIENT_BALANCE) {
                return 'Not enough funds';
            }
            if (validation.value === SwapValidation.NO_SWAPS) {
                return 'Not enough liquidity';
            }
            return '';
        });

        const actionText = computed(() => {
            if (type.value === Type.Connect) {
                return 'Connect Wallet';
            }
            if (type.value === Type.Unlock) {
                return 'Unlock';
            }
            if (type.value === Type.Swap) {
                return 'Swap';
            }
            return '';
        });

        const isUnlocked = computed(() => {
            const { allowances } = store.state.account;
            const metadata = store.getters['assets/metadata'];
            if (!addressIn.value) {
                return true;
            }
            if (addressIn.value === ETH_KEY) {
                return true;
            }
            if (isWrapPair(addressIn.value, addressOut.value)) {
                return true;
            }
            if (!amountIn.value) {
                return true;
            }
            const exchangeProxyAddress = config.addresses.exchangeProxy;
            if (!allowances[exchangeProxyAddress]) {
                return true;
            }
            const allowance = allowances[exchangeProxyAddress][addressIn.value];
            if (!allowance) {
                return true;
            }
            const decimals = metadata[addressIn.value].decimals;
            if (!decimals) {
                return true;
            }
            const allowanceNumber = new BigNumber(allowance);
            const allowanceRaw = scale(allowanceNumber, -decimals);
            return allowanceRaw.gte(amountIn.value);
        });

        function handleClick(): void {
            if (type.value === Type.Connect) {
                store.dispatch('ui/openConnectorModal');
            } else if (type.value === Type.Unlock) {
                emit('unlock');
            } else {
                emit('swap');
            }
        }

        function isWrapPair(assetIn: string, assetOut: string): boolean {
            if (assetIn === ETH_KEY && assetOut === config.addresses.weth) {
                return true;
            }
            if (assetOut === ETH_KEY && assetIn === config.addresses.weth) {
                return true;
            }
            return false;
        }

        return {
            disabled,
            text,
            loading,
            handleClick,
        };
    },
});
</script>
