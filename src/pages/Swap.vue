<template>
    <div>
        <div class="pair">
            <SwapPair
                v-model:address-in="assetInAddressInput"
                v-model:amount-in="assetInAmountInput"
                v-model:address-out="assetOutAddressInput"
                v-model:amount-out="assetOutAmountInput"
                v-model:is-exact-in="isExactIn"
                :swaps-loading="swapsLoading"
                @change="value => {
                    handleAmountChange(value);
                }"
            />
            <div class="rate-message">
                <span
                    class="rate-label"
                    @click="toggleRate"
                >
                    {{ rateMessage }}
                </span>
                <RouteTooltip
                    v-if="rateMessage && swaps.length > 0"
                    class="route-tooltip"
                    :swaps="swaps"
                />
            </div>
            <Slippage
                v-model:buffer="slippageBuffer"
                :value="slippage"
            />
            <SwapButton
                class="swap-button"
                :address-in="assetInAddressInput"
                :amount-in="assetInAmountInput"
                :address-out="assetOutAddressInput"
                :transaction-pending="transactionPending"
                :validation="validation"
                @unlock="unlock"
                @swap="swap"
            />
        </div>
        <ModalAssetSelector
            :open="isModalOpen"
            :hidden="[assetInAddressInput, assetOutAddressInput]"
            @select="handleAssetSelect"
        />
    </div>
</template>

<script lang="ts">
import { ref, defineComponent, onMounted, watch, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useIntervalFn } from '@vueuse/core';
import BigNumber from 'bignumber.js';
import { getAddress } from '@ethersproject/address';
import { ErrorCode } from '@ethersproject/logger';
import { SOR } from '@balancer-labs/sor';
import { Swap } from '@balancer-labs/sor/dist/types';

import config from '@/config';
import provider from '@/utils/provider';
import { ETH_KEY, scale, isAddress, getEtherscanLink } from '@/utils/helpers';
import { ValidationError, SwapValidation, validateNumberInput } from '@/utils/validation';
import Storage from '@/utils/storage';
import Swapper from '@/web3/swapper';
import Helper from '@/web3/helper';
import { RootState } from '@/store';

import ModalAssetSelector from '@/components/ModalAssetSelector.vue';
import Slippage from '@/components/swap/Slippage.vue';
import SwapButton from '@/components/swap/Button.vue';
import SwapPair from '@/components/swap/Pair.vue';
import RouteTooltip from '@/components/swap/RouteTooltip.vue';

// eslint-disable-next-line no-undef
const GAS_PRICE = process.env.APP_GAS_PRICE || '100000000000';
const MAX_POOLS = 4;

interface Pair {
    assetIn: string;
    assetOut: string;
}

export default defineComponent({
    components: {
        ModalAssetSelector,
        Slippage,
        SwapButton,
        SwapPair,
        RouteTooltip,
    },
    setup() {
        let sor: SOR | undefined = undefined;

        const router = useRouter();
        const store = useStore<RootState>();

        const isInRate = ref(true);
        const isExactIn = ref(true);
        const assetInAddressInput = ref('');
        const assetInAmountInput = ref('');
        const assetOutAddressInput = ref('');
        const assetOutAmountInput = ref('');
        const slippage = ref(0);
        const slippageBuffer = ref('0.5');
        const transactionPending = ref(false);
        const swapsLoading = ref(false);
        const swaps = ref<Swap[][]>([]);

        const isModalOpen = computed(() => store.state.ui.modal.asset.isOpen);
        
        const account = computed(() => {
            const { connector, address } = store.state.account;
            if (!connector || !connector.id || !address) {
                return '';
            }
            return address;
        });

        const validation = computed(() => {
            // Invalid input
            const inputError = validateNumberInput(activeInput.value);
            if (inputError === ValidationError.EMPTY) {
                return SwapValidation.EMPTY_INPUT;
            }
            if (inputError !== ValidationError.NONE) {
                return SwapValidation.INVALID_INPUT;
            }
            // No swaps
            if ((swapsLoading.value || swaps.value.length === 0) &&
                !isWrapPair(assetInAddressInput.value, assetOutAddressInput.value)
            ) {
                return SwapValidation.NO_SWAPS;
            }
            // No account
            if (!account.value) {
                return SwapValidation.NO_ACCOUNT;
            }
            // Wrong network
            const { chainId } = store.state.account;
            if (config.chainId !== chainId) {
                return SwapValidation.WRONG_NETWORK;
            }
            // Insufficient balance
            const { balances } = store.state.account;
            const { metadata } = store.state.assets;
            const assetInBalance = balances[assetInAddressInput.value];
            const assetInMetadata = metadata[assetInAddressInput.value];
            if (!assetInMetadata) {
                return SwapValidation.INSUFFICIENT_BALANCE;
            }
            const assetInDecimals = assetInMetadata.decimals;
            const assetInAmountRaw = new BigNumber(assetInAmountInput.value);
            const assetInAmount = scale(assetInAmountRaw, assetInDecimals);
            if (!assetInBalance || assetInAmount.gt(assetInBalance)) {
                return SwapValidation.INSUFFICIENT_BALANCE;
            }
            return SwapValidation.NONE;
        });

        const rateMessage = computed(() => {
            if (validation.value === SwapValidation.EMPTY_INPUT ||
                validation.value === SwapValidation.INVALID_INPUT ||
                validation.value === SwapValidation.NO_SWAPS) {
                return '';
            }
            const { metadata } = store.state.assets;
            const assetIn = metadata[assetInAddressInput.value];
            const assetOut = metadata[assetOutAddressInput.value];
            if (!assetIn || !assetOut) {
                return '';
            }
            const assetInAmount = new BigNumber(assetInAmountInput.value);
            const assetOutAmount = new BigNumber(assetOutAmountInput.value);
            const rate = isInRate.value
                ? assetOutAmount.div(assetInAmount)
                : assetInAmount.div(assetOutAmount);
            const rateString = rate.toFixed(config.precision);
            return isInRate.value
                ? `1 ${assetIn.symbol} = ${rateString} ${assetOut.symbol}`
                : `1 ${assetOut.symbol} = ${rateString} ${assetIn.symbol}`;
        });

        const activeInput = computed(() => {
            if (isExactIn.value) {
                return assetInAmountInput.value;
            } else {
                return assetOutAmountInput.value;
            }
        });

        onMounted(async () => {
            const { assetIn, assetOut } = getInitialPair();
            await fetchAssetMetadata(assetIn, assetOut);
            assetInAddressInput.value = assetIn;
            assetOutAddressInput.value = assetOut;
            slippageBuffer.value = (Storage.getSlippage() * 100).toString();
            initSor();
        });

        useIntervalFn(async () => {
            if (sor) {
                await sor.fetchPools();
                await onAmountChange(activeInput.value);
            }
        }, 60 * 1000);

        useIntervalFn(async () => {
            const assets = Object.keys(store.state.assets.metadata);
            store.dispatch('account/fetchAssets', assets);
        }, 5 * 60 * 1000);

        watch(assetInAddressInput, () => {
            Storage.saveInputAsset(config.chainId, assetInAddressInput.value);
            onAmountChange(activeInput.value);
        });

        watch(assetOutAddressInput, async () => {
            Storage.saveOutputAsset(config.chainId, assetOutAddressInput.value);
            if (sor) {
                const assetOutAddress = assetOutAddressInput.value === ETH_KEY
                    ? config.addresses.weth
                    : assetOutAddressInput.value;
                await sor.setCostOutputToken(assetOutAddress);
            }
            onAmountChange(activeInput.value);
        });

        watch(slippageBuffer, async () => {
            const slippage = parseFloat(slippageBuffer.value) / 100;
            Storage.saveSlippage(slippage);
        });

        function toggleRate(): void {
            isInRate.value = !isInRate.value;
        }

        function handleAmountChange(amount: string): void {
            onAmountChange(amount);
        }

        function handleAssetSelect(assetAddress: string): void {
            const assetModalKey = store.state.ui.modal.asset.key;
            if (assetModalKey === 'input') {
                assetInAddressInput.value = assetAddress;
            }
            if (assetModalKey === 'output') {
                assetOutAddressInput.value = assetAddress;
            }
        }

        async function unlock(): Promise<void> {
            transactionPending.value = true;
            const provider = await store.getters['account/provider'];
            const assetInAddress = assetInAddressInput.value;
            const spender = config.addresses.exchangeProxy;
            const tx = await Helper.unlock(provider, assetInAddress, spender);
            const { metadata } = store.state.assets;
            const assetSymbol = metadata[assetInAddress].symbol;
            const text = `Unlock ${assetSymbol}`;
            await handleTransaction(tx, text);
            store.dispatch('account/fetchAssets', [ assetInAddress ]);
        }

        async function swap(): Promise<void> {
            const { metadata } = store.state.assets;
            transactionPending.value = true;
            const assetInAddress = assetInAddressInput.value;
            const assetOutAddress = assetOutAddressInput.value;
            const assetInDecimals = metadata[assetInAddress].decimals;
            const assetOutDecimals = metadata[assetOutAddress].decimals;
            const assetInAmountNumber = new BigNumber(assetInAmountInput.value);
            const assetInAmount = scale(assetInAmountNumber, assetInDecimals);
            const slippageBufferRate = parseFloat(slippageBuffer.value) / 100;
            const provider = await store.getters['account/provider'];
            if (isWrapPair(assetInAddress, assetOutAddress)) {
                if (assetInAddress === ETH_KEY) {
                    const tx = await Helper.wrap(provider, assetInAmount);
                    const text = 'Wrap ether';
                    await handleTransaction(tx, text);
                } else {
                    const tx = await Helper.unwrap(provider, assetInAmount);
                    const text = 'Unwrap ether';
                    await handleTransaction(tx, text);
                }
                store.dispatch('account/fetchAssets', [ config.addresses.weth ]);
                return;
            }
            const assetInSymbol = metadata[assetInAddress].symbol;
            const assetOutSymbol = metadata[assetOutAddress].symbol;
            const text = `Swap ${assetInSymbol} for ${assetOutSymbol}`;
            if (isExactIn.value) {
                const assetOutAmountNumber = new BigNumber(assetOutAmountInput.value);
                const assetOutAmount = scale(assetOutAmountNumber, assetOutDecimals);
                const minAmount = assetOutAmount.div(1 + slippageBufferRate).integerValue(BigNumber.ROUND_DOWN);
                const tx = await Swapper.swapIn(provider, swaps.value, assetInAddress, assetOutAddress, assetInAmount, minAmount);
                await handleTransaction(tx, text);
            } else {
                const assetInAmountMax = assetInAmount.times(1 + slippageBufferRate).integerValue(BigNumber.ROUND_DOWN);
                const tx = await Swapper.swapOut(provider, swaps.value, assetInAddress, assetOutAddress, assetInAmountMax);
                await handleTransaction(tx, text);
            }
            store.dispatch('account/fetchAssets', [ assetInAddress, assetOutAddress ]);
            if (sor) {
                sor.fetchPools();
                onAmountChange(activeInput.value);
            }
        }

        async function initSor(): Promise<void> {
            sor = new SOR(
                provider,
                new BigNumber(GAS_PRICE),
                MAX_POOLS,
                config.chainId,
                config.subgraphBackupUrl,
            );

            const assetInAddress = assetInAddressInput.value === ETH_KEY
                ? config.addresses.weth
                : assetInAddressInput.value;
            const assetOutAddress = assetOutAddressInput.value === ETH_KEY
                ? config.addresses.weth
                : assetOutAddressInput.value;
            await sor.setCostOutputToken(assetOutAddress);
            await sor.fetchFilteredPairPools(assetInAddress, assetOutAddress);
            await onAmountChange(activeInput.value);
            await sor.fetchPools();
            await onAmountChange(activeInput.value);
        }

        async function onAmountChange(amount: string): Promise<void> {
            const { metadata } = store.state.assets;
            if (validateNumberInput(amount) !== ValidationError.NONE) {
                if (isExactIn.value) {
                    assetOutAmountInput.value = '';
                } else {
                    assetInAmountInput.value = '';
                }
                slippage.value = 0;
                return;
            }

            if (isWrapPair(assetInAddressInput.value, assetOutAddressInput.value)) {
                if (isExactIn.value) {
                    assetOutAmountInput.value = amount;
                } else {
                    assetInAmountInput.value = amount;
                }
                swaps.value = [];
                return;
            }

            const assetInAddress = assetInAddressInput.value === ETH_KEY
                ? config.addresses.weth
                : assetInAddressInput.value;
            const assetOutAddress = assetOutAddressInput.value === ETH_KEY
                ? config.addresses.weth
                : assetOutAddressInput.value;

            if (assetInAddress === assetOutAddress) {
                return;
            }

            if (!sor || !sor.hasDataForPair(assetInAddress, assetOutAddress)) {
                swapsLoading.value = true;
                return;
            }

            const assetInDecimals = metadata[assetInAddress].decimals;
            const assetOutDecimals = metadata[assetOutAddress].decimals;

            swapsLoading.value = true;
            if (isExactIn.value) {
                const assetInAmountRaw = new BigNumber(amount);
                const assetInAmount = scale(assetInAmountRaw, assetInDecimals);

                const [tradeSwaps, tradeAmount, spotPrice] = await sor.getSwaps(
                    assetInAddress,
                    assetOutAddress,
                    'swapExactIn',
                    assetInAmount,
                );
                swaps.value = tradeSwaps;
                const assetOutAmountRaw = scale(tradeAmount, -assetOutDecimals);
                const assetOutPrecision = config.precision;
                assetOutAmountInput.value = assetOutAmountRaw.toFixed(assetOutPrecision, BigNumber.ROUND_DOWN);
                if (tradeSwaps.length === 0) {
                    slippage.value = 0;
                } else {
                    const price = assetInAmount.div(tradeAmount).times('1e18');
                    const slippageNumber = price.div(spotPrice).minus(1);
                    slippage.value = slippageNumber.isNegative()
                        ? 0.00001
                        : slippageNumber.toNumber();
                }
            } else {
                const assetOutAmountRaw = new BigNumber(amount);
                const assetOutAmount = scale(assetOutAmountRaw, assetOutDecimals);

                const [tradeSwaps, tradeAmount, spotPrice] = await sor.getSwaps(
                    assetInAddress,
                    assetOutAddress,
                    'swapExactOut',
                    assetOutAmount,
                );
                swaps.value = tradeSwaps;
                const assetInAmountRaw = scale(tradeAmount, -assetInDecimals);
                const assetInPrecision = config.precision;
                assetInAmountInput.value = assetInAmountRaw.toFixed(assetInPrecision, BigNumber.ROUND_UP);

                if (tradeSwaps.length === 0) {
                    slippage.value = 0;
                } else {
                    const price = tradeAmount.div(assetOutAmount).times('1e18');
                    const slippageNumber = price.div(spotPrice).minus(1);
                    slippage.value = slippageNumber.isNegative()
                        ? 0.00001
                        : slippageNumber.toNumber();
                }
            }
            swapsLoading.value = false;
        }

        async function handleTransaction(transaction: any, text: string): Promise<void> {
            if (transaction.code) {
                transactionPending.value = false;
                if (transaction.code === ErrorCode.UNPREDICTABLE_GAS_LIMIT) {
                    store.dispatch('ui/notify', {
                        text: `${text} failed`,
                        type: 'warning',
                        link: 'https://help.balancer.finance',
                    });
                }
                return;
            }

            store.dispatch('account/saveTransaction', {
                transaction,
                text,
            });

            const transactionReceipt = await provider.waitForTransaction(transaction.hash, 1);
            transactionPending.value = false;
            store.dispatch('account/saveMinedTransaction', {
                receipt: transactionReceipt,
                timestamp: Date.now(),
            });

            const type = transactionReceipt.status === 1
                ? 'success'
                : 'error';
            const link = getEtherscanLink(transactionReceipt.transactionHash);
            store.dispatch('ui/notify', {
                text,
                type,
                link,
            });
        }

        async function fetchAssetMetadata(assetIn: string, assetOut: string): Promise<void> {
            const { metadata } = store.state.assets;
            const unknownAssets = [];
            if (!metadata[assetIn]) {
                unknownAssets.push(assetIn);
            }
            if (!metadata[assetOut]) {
                unknownAssets.push(assetOut);
            }
            if (unknownAssets.length === 0) {
                return;
            }
            await store.dispatch('assets/fetch', unknownAssets);
            await store.dispatch('account/fetchAssets', unknownAssets);
        }

        function getInitialPair(): Pair {
            const pair = Storage.getPair(config.chainId);
            let assetIn = 
                router.currentRoute.value.params.assetIn as string ||
                pair.inputAsset;
            let assetOut = 
                router.currentRoute.value.params.assetOut as string ||
                pair.outputAsset;
            if (isAddress(assetIn)) {
                assetIn = getAddress(assetIn);
            }
            if (isAddress(assetOut)) {
                assetOut = getAddress(assetOut);
            }
            return {
                assetIn,
                assetOut,
            };
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
            isExactIn,
            assetInAddressInput,
            assetInAmountInput,
            assetOutAddressInput,
            assetOutAmountInput,

            swaps,
            rateMessage,
            slippage,
            slippageBuffer,
            validation,

            account,
            transactionPending,
            swapsLoading,
            isModalOpen,

            toggleRate,
            handleAmountChange,
            handleAssetSelect,
            unlock,
            swap,
        };
    },
});
</script>

<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pair {
    padding: 32px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid var(--outline);
    border-radius: var(--border-radius);
}

.validation-message {
    margin-top: 16px;
    min-height: 16.5px;
    font-size: 14px;
    color: var(--error);
}

.rate-message {
    min-height: 16.5px;
    margin-top: 16px;
    display: flex;
    font-size: 14px;
    color: var(--text-secondary);
    cursor: pointer;
}

.rate-label {
    max-width: 240px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.route-tooltip {
    margin-left: 4px;
}

.status-label {
    margin-top: 32px;
    font-size: 14px;
}

.swap-button {
    margin-top: 16px;
}

@media only screen and (max-width: 768px) {
    .pair {
        padding: 16px 8px;
    }
}
</style>
