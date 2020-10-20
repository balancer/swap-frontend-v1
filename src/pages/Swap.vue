<template>
    <div>
        <div class="pair">
            <div>
                <div class="input-label">
                    Send
                    <span v-if="activeToken === 'output'">(approximate)</span>
                </div>
                <AssetInput
                    v-model:address="tokenInAddressInput"
                    v-model:amount="tokenInAmountInput"
                    :modal-key="'input'"
                    :loading="swapsLoading && activeToken === 'output'"
                    @change="value => {
                        handleAmountChange('input', value);
                    }"
                />
            </div>
            <img
                class="chevron-icon"
                :src="chevronIcon"
                @click="togglePair"
            >
            <div>
                <div class="input-label">
                    Receive
                    <span v-if="activeToken === 'input'">(approximate)</span>
                </div>
                <AssetInput
                    v-model:address="tokenOutAddressInput"
                    v-model:amount="tokenOutAmountInput"
                    :modal-key="'output'"
                    :loading="swapsLoading && activeToken === 'input'"
                    @change="value => {
                        handleAmountChange('output', value);
                    }"
                />
            </div>
            <div class="status-label">
                {{ statusLabel }}
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
            v-if="isModalOpen"
            @select="handleAssetSelect"
        />
    </div>
</template>

<script lang="ts">
import { ref, defineComponent, onMounted, watch, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import BigNumber from 'bignumber.js';
import { getAddress } from '@ethersproject/address';
import { SOR } from '@balancer-labs/sor';

import chevronIcon from '@/assets/chevronIcon.svg';

import config from '@/config';
import { CancelledTransaction, CancelledTransactionType, scale, isAddress, getEtherscanLink } from '@/utils/helpers';
import { getAssetAddressBySymbol } from '@/utils/assets';
import { ValidationError, validateNumberInput } from '@/utils/validation';
import Swapper from '@/web3/swapper';
import Helper from '@/web3/helper';

import AssetInput from '@/components/AssetInput.vue';
import Button from '@/components/Button.vue';
import ModalAssetSelector from '@/components/ModalAssetSelector.vue';

// eslint-disable-next-line no-undef
const APP_GAS_PRICE = process.env.APP_GAS_PRICE || '100000000000';
// eslint-disable-next-line no-undef
const APP_SWAP_COST = process.env.APP_SWAP_COST || '100000';
// eslint-disable-next-line no-undef
const APP_MAX_POOLS = process.env.APP_MAX_POOLS || '4';

enum Validation {
    NONE,
    INVALID_INPUT,
    NO_ACCOUNT,
    WRONG_NETWORK,
    INSUFFICIENT_BALANCE,
    NO_SWAPS,
}

export default defineComponent({
    components: {
        AssetInput,
        Button,
        ModalAssetSelector,
    },
    setup() {
        let sor: SOR | undefined = undefined;

        const router = useRouter();
        const store = useStore();

        let swaps: any[][] = [];

        const activeToken = ref('input');
        const tokenInAddressInput = ref('');
        const tokenInAmountInput = ref('10');
        const tokenOutAddressInput = ref('');
        const tokenOutAmountInput = ref('');
        const buttonLoading = ref(false);
        const swapsLoading = ref(true);

        const isModalOpen = computed(() => store.state.ui.modal.asset.isOpen);
        
        const account = computed(() => {
            const { web3Provider, address } = store.state.account;
            if (!web3Provider || !address) {
                return '';
            }
            return address;
        });

        const isUnlocked = computed(() => {
            const { allowances } = store.state.account;
            const { metadata } = store.state.assets;
            if (tokenInAddressInput.value === 'ether') {
                return true;
            }
            const exchangeProxyAddress = config.addresses.exchangeProxy;
            if (!tokenInAddressInput.value) {
                return false;
            }
            const decimals = metadata[tokenInAddressInput.value].decimals;
            if (!allowances[exchangeProxyAddress]) {
                return false;
            }
            const allowance = allowances[exchangeProxyAddress][tokenInAddressInput.value];
            if (!allowance) {
                return false;
            }
            const allowanceNumber = new BigNumber(allowance);
            const allowanceRaw = scale(allowanceNumber, -decimals);
            return allowanceRaw.gte(tokenInAmountInput.value);
        });

        const validation = computed(() => {
            // Invalid input
            const amountValue = activeToken.value === 'input'
                ? tokenInAmountInput.value
                : tokenOutAmountInput.value;
            const error = validateNumberInput(amountValue);
            if (error !== ValidationError.NONE) {
                return Validation.INVALID_INPUT;
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
            if (assetInAmount.gt(assetInBalance)) {
                return Validation.INSUFFICIENT_BALANCE;
            }
            // No swaps
            if (swapsLoading.value || swaps.length === 0) {
                return Validation.NO_SWAPS;
            }
            return Validation.NONE;
        });

        const isDisabled = computed(() => {
            return validation.value !== Validation.NONE;
        });

        const statusLabel = computed(() => {
            if (validation.value === Validation.NONE) {
                const { metadata } = store.state.assets;
                const assetInMetadata = metadata[tokenInAddressInput.value];
                const assetOutMetadata = metadata[tokenOutAddressInput.value];
                const assetInAmount = new BigNumber(tokenInAmountInput.value);
                const assetOutAmount = new BigNumber(tokenOutAmountInput.value);
                const price = assetOutAmount.div(assetInAmount);
                return `1 ${assetInMetadata.symbol} = ${price.toFixed(4)} ${assetOutMetadata.symbol}`;
            }
            if (validation.value === Validation.INVALID_INPUT) {
                return 'Invalid input';
            }
            if (validation.value === Validation.NO_ACCOUNT) {
                return 'Connect account to continue';
            }
            if (validation.value === Validation.WRONG_NETWORK) {
                return 'Change network to continue';
            }
            if (validation.value === Validation.INSUFFICIENT_BALANCE) {
                return 'Insufficient balance';
            }
            if (validation.value === Validation.NO_SWAPS) {
                return 'Insufficient liquidity';
            }
        });

        const activeInput = computed(() => {
            if (activeToken.value === 'input') {
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
            initSor();
        });

        watch(tokenInAddressInput, () => {
            onAmountChange(activeInput.value);
        });

        watch(tokenOutAddressInput, () => {
            onAmountChange(activeInput.value);
        });

        function handleAmountChange(input: string, amount: string): void {
            activeToken.value = input;
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

        async function connect(): Promise<void> {
            store.dispatch('account/connect', 'injected');
        }

        async function disconnect(): Promise<void> {
            store.dispatch('account/disconnect');
        }

        async function togglePair(): Promise<void> {
            const tokenInAddress = tokenOutAddressInput.value;
            const tokenInAmount = tokenOutAmountInput.value;
            const tokenOutAddress = tokenInAddressInput.value;
            const tokenOutAmount = tokenInAmountInput.value;
            activeToken.value = activeToken.value === 'input'
                ? 'output'
                : 'input';
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
            const provider = await store.getters['account/provider'];
            if (activeToken.value === 'input') {
                const tokenInAmountNumber = new BigNumber(tokenInAmountInput.value);
                const tokenInDecimals = metadata[tokenInAddress].decimals;
                const tokenInAmount = scale(tokenInAmountNumber, tokenInDecimals);
                const minAmount = new BigNumber(0);
                const tx = await Swapper.swapIn(provider, swaps, tokenInAddress, tokenOutAddress, tokenInAmount, minAmount);
                handleSwapTransaction(tx, tokenInAddress, tokenOutAddress);
            } else {
                const tokenInAmountNumber = new BigNumber(tokenInAmountInput.value);
                const tokenInDecimals = metadata[tokenInAddress].decimals;
                const tokenInAmountMax = scale(tokenInAmountNumber, tokenInDecimals);
                const tx = await Swapper.swapOut(provider, swaps, tokenInAddress, tokenOutAddress, tokenInAmountMax);
                handleSwapTransaction(tx, tokenInAddress, tokenOutAddress);
            }
        }

        async function initSor(): Promise<void> {
            const provider = await store.getters['account/provider'];
            const multicallAddress = config.addresses.multicall;
            const subgraphUrl = config.subgraphUrl;

            const sorInstance = new SOR(
                provider,
                new BigNumber(APP_GAS_PRICE),
                parseInt(APP_MAX_POOLS),
            );
            await sorInstance.fetchSubgraphPools(subgraphUrl);
            sor = sorInstance;
            await onAmountChange(activeInput.value);
            await sorInstance.fetchOnChainPools(multicallAddress);
        }

        async function onAmountChange(amount: string): Promise<void> {
            const { metadata } = store.state.assets;
            const isInputActive = activeToken.value === 'input';
            if (!amount) {
                if (isInputActive) {
                    tokenOutAmountInput.value = '';
                } else {
                    tokenInAmountInput.value = '';
                }
            }

            if (!sor) {
                return;
            }

            const tokenInAddress = tokenInAddressInput.value === 'ether'
                ? config.addresses.weth
                : tokenInAddressInput.value;
            const tokenOutAddress = tokenOutAddressInput.value === 'ether'
                ? config.addresses.weth
                : tokenOutAddressInput.value;
            const tokenInDecimals = metadata[tokenInAddress].decimals;
            const tokenOutDecimals = metadata[tokenOutAddress].decimals;

            swapsLoading.value = true;
            if (isInputActive) {
                const tokenInAmountRaw = new BigNumber(amount);
                const tokenInAmount = scale(tokenInAmountRaw, tokenInDecimals);
                const [tradeSwaps, tradeAmount] = await sor.getSwaps(
                    tokenInAddress,
                    tokenOutAddress,
                    'swapExactIn',
                    tokenInAmount,
                    false,
                );
                swaps = tradeSwaps;
                const tokenOutAmountRaw = scale(tradeAmount, -tokenOutDecimals);
                const tokenOutPrecision = metadata[tokenOutAddress].precision;
                tokenOutAmountInput.value = tokenOutAmountRaw.toFixed(tokenOutPrecision, BigNumber.ROUND_DOWN);
            } else {
                const tokenOutAmountRaw = new BigNumber(amount);
                const tokenOutAmount = scale(tokenOutAmountRaw, tokenOutDecimals);
                const [tradeSwaps, tradeAmount] = await sor.getSwaps(
                    tokenInAddress,
                    tokenOutAddress,
                    'swapExactOut',
                    tokenOutAmount,
                    false,
                );
                swaps = tradeSwaps;
                const tokenInAmountRaw = scale(tradeAmount, -tokenInDecimals);
                const tokenInPrecision = metadata[tokenInAddress].precision;
                tokenInAmountInput.value = tokenInAmountRaw.toFixed(tokenInPrecision, BigNumber.ROUND_UP);
            }
            swapsLoading.value = false;
        }

        async function handleUnlockTransaction(transaction: any, assetIn: string): Promise<void> {
            if (transaction instanceof CancelledTransaction) {
                buttonLoading.value = false;
                if (transaction.type === CancelledTransactionType.REVERTED) {
                    store.dispatch('ui/notify', {
                        text: 'Couldn\'t unlock token',
                        type: 'warning',
                        link: 'https://help.balancer.finance',
                    });
                }
                return;
            }
            store.dispatch('account/saveTransaction', transaction);

            const provider = store.getters['account/readProvider'];
            const transactionReceipt = await provider.waitForTransaction(transaction.hash, 1);
            buttonLoading.value = false;
            store.dispatch('account/fetchAssets', [ assetIn ]);
            store.dispatch('account/saveTransactionReceipt', transactionReceipt);

            const type = transactionReceipt.status === 1
                ? 'success'
                : 'error';
            const text = transactionReceipt.status === 1
                ? 'Unlocked'
                : 'Unlock failed';
            const link = getEtherscanLink(transactionReceipt.transactionHash);
            store.dispatch('ui/notify', {
                text,
                type,
                link,
            });
        }

        async function handleSwapTransaction(transaction: any, assetIn: string, assetOut: string): Promise<void> {
            if (transaction instanceof CancelledTransaction) {
                buttonLoading.value = false;
                if (transaction.type === CancelledTransactionType.REVERTED) {
                    store.dispatch('ui/notify', {
                        text: 'Couldn\'t swap tokens',
                        type: 'warning',
                        link: 'https://help.balancer.finance',
                    });
                }
                return;
            }
            store.dispatch('account/saveTransaction', transaction);

            const provider = store.getters['account/readProvider'];
            const transactionReceipt = await provider.waitForTransaction(transaction.hash, 1);
            buttonLoading.value = false;
            store.dispatch('account/fetchAssets', [ assetIn, assetOut ]);
            store.dispatch('account/saveTransactionReceipt', transactionReceipt);

            const type = transactionReceipt.status === 1
                ? 'success'
                : 'error';
            const text = transactionReceipt.status === 1
                ? 'Swapped'
                : 'Swap failed';
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

        function getInitialPair(): any {
            const { metadata } = store.state.assets;
            let assetIn = router.currentRoute.value.params.assetIn as string;
            let assetOut = router.currentRoute.value.params.assetOut as string;
            if (!assetIn || !assetOut) {
                return {
                    assetIn: getAssetAddressBySymbol(metadata, 'ETH'),
                    assetOut: getAssetAddressBySymbol(metadata, 'USDC'),
                };
            }
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
            activeToken,
            tokenInAddressInput,
            tokenInAmountInput,
            tokenOutAddressInput,
            tokenOutAmountInput,

            statusLabel,

            chevronIcon,

            buttonLoading,
            swapsLoading,
            isModalOpen,
            isUnlocked,
            isDisabled,

            handleAmountChange,
            handleAssetSelect,
            connect,
            disconnect,
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
    color: var(--text-secondary);
    font-size: 14px;
}

.chevron-icon {
    margin-top: 8px;
}

.status-label {
    margin-top: 32px;
    font-size: 14px;
}

.swap-button {
    margin-top: 16px;
}
</style>
