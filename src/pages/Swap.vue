<template>
    <div>
        <div class="pair">
            <div>
                <div class="input-label">
                    <div>
                        Send
                        <span v-if="!isExactIn">(approximate)</span>
                    </div>
                    <div class="balance-label">
                        {{ assetInBalanceLabel }}
                    </div>
                </div>
                <AssetInput
                    v-model:address="tokenInAddressInput"
                    v-model:amount="tokenInAmountInput"
                    :modal-key="'input'"
                    :loading="swapsLoading && !isExactIn"
                    @change="value => {
                        handleAmountChange(true, value);
                    }"
                />
            </div>
            <Icon
                class="toggle-icon"
                :title="'chevron'"
                @click="togglePair"
            />
            <div>
                <div class="input-label">
                    <div>
                        Receive
                        <span v-if="isExactIn">(approximate)</span>
                    </div>
                    <div class="balance-label">
                        {{ assetOutBalanceLabel }}
                    </div>
                </div>
                <AssetInput
                    v-model:address="tokenOutAddressInput"
                    v-model:amount="tokenOutAmountInput"
                    :modal-key="'output'"
                    :loading="swapsLoading && isExactIn"
                    @change="value => {
                        handleAmountChange(false, value);
                    }"
                />
            </div>
            <div class="rate-message">
                <span
                    class="rate-label"
                    @click="toggleRate"
                >
                    {{ rateMessage }}
                </span>
                <RouteTooltip
                    v-if="rateMessage"
                    class="route-tooltip"
                    :swaps="swaps"
                />
            </div>
            <Slippage
                v-model:buffer="slippageBuffer"
                :value="slippage"
            />
            <div class="validation-message">
                {{ validationMessage }}
            </div>
            <Button
                v-if="isUnlocked"
                class="swap-button"
                :disabled="isDisabled || buttonLoading"
                :text="'Swap'"
                :primary="true"
                :loading="buttonLoading"
                @click="swap"
            />
            <Button
                v-else
                class="swap-button"
                :disabled="isDisabled || buttonLoading"
                :text="'Unlock'"
                :primary="true"
                :loading="buttonLoading"
                @click="unlock"
            />
        </div>
        <ModalAssetSelector
            :open="isModalOpen"
            :hidden="[tokenInAddressInput, tokenOutAddressInput]"
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
import { ValidationError, validateNumberInput } from '@/utils/validation';
import Storage from '@/utils/storage';
import Swapper from '@/web3/swapper';
import Helper from '@/web3/helper';
import { RootState } from '@/store';

import AssetInput from '@/components/AssetInput.vue';
import Button from '@/components/Button.vue';
import Icon from '@/components/Icon.vue';
import ModalAssetSelector from '@/components/ModalAssetSelector.vue';
import Slippage from '@/components/swap/Slippage.vue';
import RouteTooltip from '@/components/swap/RouteTooltip.vue';

// eslint-disable-next-line no-undef
const GAS_PRICE = process.env.APP_GAS_PRICE || '100000000000';
const MAX_POOLS = 4;

enum Validation {
    NONE,
    EMPTY_INPUT,
    INVALID_INPUT,
    NO_ACCOUNT,
    WRONG_NETWORK,
    ETH_WETH_PAIR,
    INSUFFICIENT_BALANCE,
    NO_SWAPS,
}

interface Pair {
    assetIn: string;
    assetOut: string;
}

export default defineComponent({
    components: {
        AssetInput,
        Button,
        Icon,
        ModalAssetSelector,
        Slippage,
        RouteTooltip,
    },
    setup() {
        let sor: SOR | undefined = undefined;

        const router = useRouter();
        const store = useStore<RootState>();

        const isInRate = ref(true);
        const isExactIn = ref(true);
        const tokenInAddressInput = ref('');
        const tokenInAmountInput = ref('');
        const tokenOutAddressInput = ref('');
        const tokenOutAmountInput = ref('');
        const slippage = ref(0);
        const slippageBuffer = ref('0.5');
        const buttonLoading = ref(false);
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

        const assetInBalanceLabel = computed(() => {
            const { balances } = store.state.account;
            const { metadata } = store.state.assets;
            if (!balances || !metadata) {
                return '';
            }

            const assetMetadata = metadata[tokenInAddressInput.value];
            const balance = balances[tokenInAddressInput.value];
            const balanceNumber = new BigNumber(balance);
            if (!assetMetadata || !balance) {
                return '';
            }

            const assetSymbol = assetMetadata.symbol;
            const assetDecimals = assetMetadata.decimals;
            const balanceShortNumber = scale(balanceNumber, -assetDecimals);
            const balanceShort = balanceShortNumber.isInteger()
                ? balanceShortNumber.toString()
                : balanceShortNumber.toFixed(config.precision);
            return `Balance: ${balanceShort} ${assetSymbol}`;
        });

        const assetOutBalanceLabel = computed(() => {
            const { balances } = store.state.account;
            const { metadata } = store.state.assets;

            if (!balances || !metadata) {
                return '';
            }

            const assetMetadata = metadata[tokenOutAddressInput.value];
            const balance = balances[tokenOutAddressInput.value];
            const balanceNumber = new BigNumber(balance);
            if (!assetMetadata || !balance) {
                return '';
            }

            const assetSymbol = assetMetadata.symbol;
            const assetDecimals = assetMetadata.decimals;
            const balanceShortNumber = scale(balanceNumber, -assetDecimals);
            const balanceShort = balanceShortNumber.isInteger()
                ? balanceShortNumber.toString()
                : balanceShortNumber.toFixed(config.precision);
            return `Balance: ${balanceShort} ${assetSymbol}`;
        });

        const isUnlocked = computed(() => {
            const { allowances } = store.state.account;
            const { metadata } = store.state.assets;
            if (!tokenInAddressInput.value) {
                return true;
            }
            if (tokenInAddressInput.value === ETH_KEY) {
                return true;
            }
            if (!tokenInAmountInput.value) {
                return true;
            }
            const exchangeProxyAddress = config.addresses.exchangeProxy;
            if (!allowances[exchangeProxyAddress]) {
                return true;
            }
            const allowance = allowances[exchangeProxyAddress][tokenInAddressInput.value];
            if (!allowance) {
                return true;
            }
            const decimals = metadata[tokenInAddressInput.value].decimals;
            if (!decimals) {
                return true;
            }
            const allowanceNumber = new BigNumber(allowance);
            const allowanceRaw = scale(allowanceNumber, -decimals);
            return allowanceRaw.gte(tokenInAmountInput.value);
        });

        const validation = computed(() => {
            // Invalid input
            const inputError = validateNumberInput(activeInput.value);
            if (inputError === ValidationError.EMPTY) {
                return Validation.EMPTY_INPUT;
            }
            if (inputError !== ValidationError.NONE) {
                return Validation.INVALID_INPUT;
            }
            // No swaps
            if (swapsLoading.value || swaps.value.length === 0) {
                return Validation.NO_SWAPS;
            }
            // Invalid pair (WETH/ETH)
            if (tokenInAddressInput.value === ETH_KEY &&
                tokenOutAddressInput.value === config.addresses.weth
            ) {
                return Validation.ETH_WETH_PAIR;
            }
            if (tokenOutAddressInput.value === ETH_KEY &&
                tokenInAddressInput.value === config.addresses.weth
            ) {
                return Validation.ETH_WETH_PAIR;
            }
            // No account
            if (!account.value) {
                return Validation.NO_ACCOUNT;
            }
            // Wrong network
            const { chainId } = store.state.account;
            if (config.chainId !== chainId) {
                return Validation.WRONG_NETWORK;
            }
            // Insufficient balance
            const { balances } = store.state.account;
            const { metadata } = store.state.assets;
            const assetInBalance = balances[tokenInAddressInput.value];
            const assetInMetadata = metadata[tokenInAddressInput.value];
            if (!assetInMetadata) {
                return Validation.INSUFFICIENT_BALANCE;
            }
            const assetInDecimals = assetInMetadata.decimals;
            const assetInAmountRaw = new BigNumber(tokenInAmountInput.value);
            const assetInAmount = scale(assetInAmountRaw, assetInDecimals);
            if (!assetInBalance || assetInAmount.gt(assetInBalance)) {
                return Validation.INSUFFICIENT_BALANCE;
            }
            return Validation.NONE;
        });

        const isDisabled = computed(() => {
            return validation.value !== Validation.NONE;
        });

        const rateMessage = computed(() => {
            if (validation.value === Validation.EMPTY_INPUT ||
                validation.value === Validation.INVALID_INPUT ||
                validation.value === Validation.NO_SWAPS) {
                return '';
            }
            const { metadata } = store.state.assets;
            const assetIn = metadata[tokenInAddressInput.value];
            const assetOut = metadata[tokenOutAddressInput.value];
            if (!assetIn || !assetOut) {
                return '';
            }
            const assetInAmount = new BigNumber(tokenInAmountInput.value);
            const assetOutAmount = new BigNumber(tokenOutAmountInput.value);
            const rate = isInRate.value
                ? assetOutAmount.div(assetInAmount)
                : assetInAmount.div(assetOutAmount);
            const rateString = rate.toFixed(config.precision);
            return isInRate.value
                ? `1 ${assetIn.symbol} = ${rateString} ${assetOut.symbol}`
                : `1 ${assetOut.symbol} = ${rateString} ${assetIn.symbol}`;
        });

        const validationMessage = computed(() => {
            if (validation.value === Validation.EMPTY_INPUT) {
                return 'Enter swap amount';
            }
            if (validation.value === Validation.INVALID_INPUT) {
                return 'Invalid swap amount';
            }
            if (validation.value === Validation.NO_ACCOUNT) {
                return 'Connect account to continue';
            }
            if (validation.value === Validation.WRONG_NETWORK) {
                return 'Change network to continue';
            }
            if (validation.value === Validation.ETH_WETH_PAIR) {
                return 'Please wrap ether manually';
            }
            if (validation.value === Validation.INSUFFICIENT_BALANCE) {
                return 'Not enough funds';
            }
            if (validation.value === Validation.NO_SWAPS) {
                return 'Not enough liquidity';
            }
            return '';
        });

        const activeInput = computed(() => {
            if (isExactIn.value) {
                return tokenInAmountInput.value;
            } else {
                return tokenOutAmountInput.value;
            }
        });

        onMounted(async () => {
            const { assetIn, assetOut } = getInitialPair();
            await fetchTokenMetadata(assetIn, assetOut);
            tokenInAddressInput.value = assetIn;
            tokenOutAddressInput.value = assetOut;
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
            store.dispatch('account/fetchState');
        }, 5 * 60 * 1000);

        watch(tokenInAddressInput, () => {
            Storage.saveInputAsset(config.chainId, tokenInAddressInput.value);
            onAmountChange(activeInput.value);
        });

        watch(tokenOutAddressInput, async () => {
            Storage.saveOutputAsset(config.chainId, tokenOutAddressInput.value);
            if (sor) {
                const tokenOutAddress = tokenOutAddressInput.value === ETH_KEY
                    ? config.addresses.weth
                    : tokenOutAddressInput.value;
                await sor.setCostOutputToken(tokenOutAddress);
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

        function handleAmountChange(exactIn: boolean, amount: string): void {
            isExactIn.value = exactIn;
            onAmountChange(amount);
        }

        function handleAssetSelect(assetAddress: string): void {
            const assetModalKey = store.state.ui.modal.asset.key;
            if (assetModalKey === 'input') {
                tokenInAddressInput.value = assetAddress;
            }
            if (assetModalKey === 'output') {
                tokenOutAddressInput.value = assetAddress;
            }
        }

        async function togglePair(): Promise<void> {
            const tokenInAddress = tokenOutAddressInput.value;
            const tokenInAmount = tokenOutAmountInput.value;
            const tokenOutAddress = tokenInAddressInput.value;
            const tokenOutAmount = tokenInAmountInput.value;
            isExactIn.value = !isExactIn.value;
            tokenInAddressInput.value = tokenInAddress;
            tokenInAmountInput.value = tokenInAmount;
            tokenOutAddressInput.value = tokenOutAddress;
            tokenOutAmountInput.value = tokenOutAmount;
        }

        async function unlock(): Promise<void> {
            buttonLoading.value = true;
            const provider = await store.getters['account/provider'];
            const tokenInAddress = tokenInAddressInput.value;
            const spender = config.addresses.exchangeProxy;
            const tx = await Helper.unlock(provider, tokenInAddress, spender);
            handleUnlockTransaction(tx, tokenInAddress);
        }

        async function swap(): Promise<void> {
            const { metadata } = store.state.assets;
            buttonLoading.value = true;
            const tokenInAddress = tokenInAddressInput.value;
            const tokenOutAddress = tokenOutAddressInput.value;
            const tokenInDecimals = metadata[tokenInAddress].decimals;
            const tokenOutDecimals = metadata[tokenOutAddress].decimals;
            const slippageBufferRate = parseFloat(slippageBuffer.value) / 100;
            const provider = await store.getters['account/provider'];
            if (isExactIn.value) {
                const tokenInAmountNumber = new BigNumber(tokenInAmountInput.value);
                const tokenInAmount = scale(tokenInAmountNumber, tokenInDecimals);
                const tokenOutAmountNumber = new BigNumber(tokenOutAmountInput.value);
                const tokenOutAmount = scale(tokenOutAmountNumber, tokenOutDecimals);
                const minAmount = tokenOutAmount.div(1 + slippageBufferRate).integerValue(BigNumber.ROUND_DOWN);
                const tx = await Swapper.swapIn(provider, swaps.value, tokenInAddress, tokenOutAddress, tokenInAmount, minAmount);
                handleSwapTransaction(tx, tokenInAddress, tokenOutAddress);
            } else {
                const tokenInAmountNumber = new BigNumber(tokenInAmountInput.value);
                const tokenInAmount = scale(tokenInAmountNumber, tokenInDecimals);
                const tokenInAmountMax = tokenInAmount.times(1 + slippageBufferRate).integerValue(BigNumber.ROUND_DOWN);
                const tx = await Swapper.swapOut(provider, swaps.value, tokenInAddress, tokenOutAddress, tokenInAmountMax);
                handleSwapTransaction(tx, tokenInAddress, tokenOutAddress);
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

            const tokenInAddress = tokenInAddressInput.value === ETH_KEY
                ? config.addresses.weth
                : tokenInAddressInput.value;
            const tokenOutAddress = tokenOutAddressInput.value === ETH_KEY
                ? config.addresses.weth
                : tokenOutAddressInput.value;
            await sor.setCostOutputToken(tokenOutAddress);
            await sor.fetchFilteredPairPools(tokenInAddress, tokenOutAddress);
            await onAmountChange(activeInput.value);
            await sor.fetchPools();
            await onAmountChange(activeInput.value);
        }

        async function onAmountChange(amount: string): Promise<void> {
            const { metadata } = store.state.assets;
            if (validateNumberInput(amount) !== ValidationError.NONE) {
                if (isExactIn.value) {
                    tokenOutAmountInput.value = '';
                } else {
                    tokenInAmountInput.value = '';
                }
                slippage.value = 0;
                return;
            }

            const tokenInAddress = tokenInAddressInput.value === ETH_KEY
                ? config.addresses.weth
                : tokenInAddressInput.value;
            const tokenOutAddress = tokenOutAddressInput.value === ETH_KEY
                ? config.addresses.weth
                : tokenOutAddressInput.value;

            if (tokenInAddress === tokenOutAddress) {
                return;
            }

            if (!sor || !sor.hasDataForPair(tokenInAddress, tokenOutAddress)) {
                swapsLoading.value = true;
                return;
            }

            const tokenInDecimals = metadata[tokenInAddress].decimals;
            const tokenOutDecimals = metadata[tokenOutAddress].decimals;

            swapsLoading.value = true;
            if (isExactIn.value) {
                const tokenInAmountRaw = new BigNumber(amount);
                const tokenInAmount = scale(tokenInAmountRaw, tokenInDecimals);

                const [tradeSwaps, tradeAmount, spotPrice] = await sor.getSwaps(
                    tokenInAddress,
                    tokenOutAddress,
                    'swapExactIn',
                    tokenInAmount,
                );
                swaps.value = tradeSwaps;
                const tokenOutAmountRaw = scale(tradeAmount, -tokenOutDecimals);
                const tokenOutPrecision = config.precision;
                tokenOutAmountInput.value = tokenOutAmountRaw.toFixed(tokenOutPrecision, BigNumber.ROUND_DOWN);
                if (tradeSwaps.length === 0) {
                    slippage.value = 0;
                } else {
                    const price = tokenInAmount.div(tradeAmount).times('1e18');
                    const slippageNumber = price.div(spotPrice).minus(1);
                    slippage.value = slippageNumber.isNegative()
                        ? 0.00001
                        : slippageNumber.toNumber();
                }
            } else {
                const tokenOutAmountRaw = new BigNumber(amount);
                const tokenOutAmount = scale(tokenOutAmountRaw, tokenOutDecimals);

                const [tradeSwaps, tradeAmount, spotPrice] = await sor.getSwaps(
                    tokenInAddress,
                    tokenOutAddress,
                    'swapExactOut',
                    tokenOutAmount,
                );
                swaps.value = tradeSwaps;
                const tokenInAmountRaw = scale(tradeAmount, -tokenInDecimals);
                const tokenInPrecision = config.precision;
                tokenInAmountInput.value = tokenInAmountRaw.toFixed(tokenInPrecision, BigNumber.ROUND_UP);

                if (tradeSwaps.length === 0) {
                    slippage.value = 0;
                } else {
                    const price = tradeAmount.div(tokenOutAmount).times('1e18');
                    const slippageNumber = price.div(spotPrice).minus(1);
                    slippage.value = slippageNumber.isNegative()
                        ? 0.00001
                        : slippageNumber.toNumber();
                }
            }
            swapsLoading.value = false;
        }

        async function handleUnlockTransaction(transaction: any, asset: string): Promise<void> {
            if (transaction.code) {
                buttonLoading.value = false;
                if (transaction.code === ErrorCode.UNPREDICTABLE_GAS_LIMIT) {
                    store.dispatch('ui/notify', {
                        text: 'Couldn\'t unlock token',
                        type: 'warning',
                        link: 'https://help.balancer.finance',
                    });
                }
                return;
            }

            const { metadata } = store.state.assets;
            const assetSymbol = metadata[asset].symbol;
            const text = `Unlock ${assetSymbol}`;
            store.dispatch('account/saveTransaction', {
                transaction,
                text,
            });

            const transactionReceipt = await provider.waitForTransaction(transaction.hash, 1);
            buttonLoading.value = false;
            store.dispatch('account/fetchAssets', [ asset ]);
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

        async function handleSwapTransaction(transaction: any, assetIn: string, assetOut: string): Promise<void> {
            if (transaction.code) {
                buttonLoading.value = false;
                if (transaction.code === ErrorCode.UNPREDICTABLE_GAS_LIMIT) {
                    store.dispatch('ui/notify', {
                        text: 'Couldn\'t swap tokens',
                        type: 'warning',
                        link: 'https://help.balancer.finance',
                    });
                }
                return;
            }
            const { metadata } = store.state.assets;
            const assetInSymbol = metadata[assetIn].symbol;
            const assetOutSymbol = metadata[assetOut].symbol;
            const text = `Swap ${assetInSymbol} for ${assetOutSymbol}`;
            store.dispatch('account/saveTransaction', {
                transaction,
                text,
            });

            const transactionReceipt = await provider.waitForTransaction(transaction.hash, 1);
            buttonLoading.value = false;
            if (transactionReceipt.status === 1) {
                tokenInAmountInput.value = '';
                tokenOutAmountInput.value = '';
            }
            store.dispatch('account/fetchAssets', [ assetIn, assetOut ]);
            store.dispatch('account/saveMinedTransaction', {
                receipt: transactionReceipt,
                timestamp: Date.now(),
            });
            if (sor) {
                sor.fetchPools();
                onAmountChange(activeInput.value);
            }

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

        async function fetchTokenMetadata(assetIn: string, assetOut: string): Promise<void> {
            const { metadata } = store.state.assets;
            const unknownTokens = [];
            if (!metadata[assetIn]) {
                unknownTokens.push(assetIn);
            }
            if (!metadata[assetOut]) {
                unknownTokens.push(assetOut);
            }
            if (unknownTokens.length === 0) {
                return;
            }
            await store.dispatch('assets/fetch', unknownTokens);
            await store.dispatch('account/fetchAssets', unknownTokens);
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

        return {
            isExactIn,
            assetInBalanceLabel,
            assetOutBalanceLabel,
            tokenInAddressInput,
            tokenInAmountInput,
            tokenOutAddressInput,
            tokenOutAmountInput,

            swaps,
            rateMessage,
            slippage,
            slippageBuffer,
            validationMessage,

            buttonLoading,
            swapsLoading,
            isModalOpen,
            isUnlocked,
            isDisabled,

            toggleRate,
            handleAmountChange,
            handleAssetSelect,
            togglePair,
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

.input-label {
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    color: var(--text-secondary);
    font-size: 14px;
}

.balance-label {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.toggle-icon {
    width: 24px;
    height: 24px;
    margin-top: 8px;
    cursor: pointer;
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
