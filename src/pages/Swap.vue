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
                    :loading="isLoading.input"
                    @change="handleAmountChange('input')"
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
                    :loading="isLoading.output"
                    @change="handleAmountChange('output')"
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
import { ethers } from 'ethers';

import chevronIcon from '@/assets/chevronIcon.svg';

import config from '@/config';
import { CancelledTransaction, scale, isAddress } from '@/utils/helpers';
import SOR from '@/utils/sor';
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
        const router = useRouter();
        const store = useStore();
        const assets = store.state.assets.metadata;
        const { allowances } = store.state.account;

        const sor = ref(null);
        const swaps = ref([]);
        const tokenCost = ref({});
        const swapPath = ref({});

        const activeToken = ref('input');
        const tokenInAddressInput = ref('');
        const tokenInAmountInput = ref('10');
        const tokenOutAddressInput = ref('');
        const tokenOutAmountInput = ref('');
        const buttonLoading = ref(false);

        const isModalOpen = computed(() => store.state.ui.modal.asset.isOpen);
        
        const account = computed(() => {
            const { web3Provider, address } = store.state.account;
            if (!web3Provider || !address) {
                return '';
            }
            return address;
        });

        const isUnlocked = computed(() => {
            if (tokenInAddressInput.value === 'ether') {
                return true;
            }
            const exchangeProxyAddress = config.addresses.exchangeProxy;
            if (!tokenInAddressInput.value) {
                return false;
            }
            const decimals = assets[tokenInAddressInput.value].decimals;
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

        const isLoading = computed(() => {
            const tokenInAddress = tokenInAddressInput.value === 'ether'
                ? config.addresses.weth
                : tokenInAddressInput.value;
            const tokenOutAddress = tokenOutAddressInput.value === 'ether'
                ? config.addresses.weth
                : tokenOutAddressInput.value;
            if (activeToken.value === 'input') {
                const outputTokenLoading =
                    !tokenCost.value[tokenOutAddress] ||
                    !swapPath.value[tokenInAddress] ||
                    !swapPath.value[tokenInAddress][tokenOutAddress] ||
                    !swapPath.value[tokenInAddress][tokenOutAddress].in;
                return {
                    input: false,
                    output: outputTokenLoading,
                };
            } else {
                const inputTokenLoading =
                    !tokenCost.value[tokenInAddress] ||
                    !swapPath.value[tokenInAddress] ||
                    !swapPath.value[tokenInAddress][tokenOutAddress] ||
                    !swapPath.value[tokenInAddress][tokenOutAddress].out;
                return {
                    input: inputTokenLoading,
                    output: false,
                };
            }
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
            if (swaps.value.length === 0) {
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

        async function updatePaths(): Promise<void> {
            if (!sor.value) {
                return;
            }
            const tokenInAddress = tokenInAddressInput.value === 'ether'
                ? config.addresses.weth
                : tokenInAddressInput.value;
            const tokenOutAddress = tokenOutAddressInput.value === 'ether'
                ? config.addresses.weth
                : tokenOutAddressInput.value;
            if (activeToken.value === 'input') {
                // @ts-ignore
                if (!tokenCost.value[tokenOutAddress]) {
                    // @ts-ignore
                    tokenCost.value[tokenOutAddress] = await sor.value.getTokenCost(tokenOutAddress);
                }
                // @ts-ignore
                if (!swapPath.value[tokenInAddress]) {
                    // @ts-ignore
                    swapPath.value[tokenInAddress] = {};
                }
                // @ts-ignore
                if (!swapPath.value[tokenInAddress][tokenOutAddress]) {
                    // @ts-ignore
                    swapPath.value[tokenInAddress][tokenOutAddress] = {};
                }
                // @ts-ignore
                if (!swapPath.value[tokenInAddress][tokenOutAddress].in) {
                    // @ts-ignore
                    swapPath.value[tokenInAddress][tokenOutAddress].in = sor.value.getInPath(tokenInAddress, tokenOutAddress);
                }
            } else {
                // @ts-ignore
                if (!tokenCost.value[tokenInAddress]) {
                    // @ts-ignore
                    tokenCost.value[tokenInAddress] = await sor.value.getTokenCost(tokenInAddress);
                }
                // @ts-ignore
                if (!swapPath.value[tokenInAddress]) {
                    // @ts-ignore
                    swapPath.value[tokenInAddress] = {};
                }
                // @ts-ignore
                if (!swapPath.value[tokenInAddress][tokenOutAddress]) {
                    // @ts-ignore
                    swapPath.value[tokenInAddress][tokenOutAddress] = {};
                }
                // @ts-ignore
                if (!swapPath.value[tokenInAddress][tokenOutAddress].out) {
                    // @ts-ignore
                    swapPath.value[tokenInAddress][tokenOutAddress].out = sor.value.getOutPath(tokenInAddress, tokenOutAddress);
                }
            }
        }

        function onAmountChange(): void {
            const isInputActive = activeToken.value === 'input';
            if (isInputActive) {
                if (tokenInAmountInput.value === '') {
                    tokenOutAmountInput.value = '';
                    return;
                }
            } else {
                if (tokenOutAmountInput.value === '') {
                    tokenInAmountInput.value = '';
                    return;
                }
            }

            const tokenInAddress = tokenInAddressInput.value === 'ether'
                ? config.addresses.weth
                : tokenInAddressInput.value;
            const tokenOutAddress = tokenOutAddressInput.value === 'ether'
                ? config.addresses.weth
                : tokenOutAddressInput.value;
            const tokenInDecimals = assets[tokenInAddress].decimals;
            const tokenOutDecimals = assets[tokenOutAddress].decimals;

            const tokenInAmountRaw = new BigNumber(tokenInAmountInput.value);
            const tokenInAmount = scale(tokenInAmountRaw, tokenInDecimals);
            const tokenOutAmountRaw = new BigNumber(tokenOutAmountInput.value);
            const tokenOutAmount = scale(tokenOutAmountRaw, tokenOutDecimals);

            if (!sor.value ||
                // @ts-ignore
                !swapPath.value[tokenInAddress] ||
                // @ts-ignore
                !swapPath.value[tokenInAddress][tokenOutAddress]
            ) {
                if (isInputActive) {
                    return;
                } else {
                    return;
                }
            }

            if (isInputActive) {
                if (
                    // @ts-ignore
                    !swapPath.value[tokenInAddress][tokenOutAddress].in ||
                    // @ts-ignore
                    !tokenCost.value[tokenOutAddress]
                ) {
                    return;
                }

                // @ts-ignore
                const paths = swapPath.value[tokenInAddress][tokenOutAddress].in;
                // @ts-ignore
                const [tradeSwaps, tradeAmount] = sor.value.getInTrade(
                    tokenInAmount,
                    paths.pools,
                    paths.paths,
                    paths.epsOfInterest,
                    // @ts-ignore
                    tokenCost.value[tokenOutAddress],
                );
                swaps.value = tradeSwaps;
                const tokenOutAmountRaw = scale(tradeAmount, -tokenOutDecimals);
                const tokenOutPrecision = assets[tokenOutAddress].precision;
                tokenOutAmountInput.value = tokenOutAmountRaw.toFixed(tokenOutPrecision, BigNumber.ROUND_DOWN);
            } else {
                if (
                    // @ts-ignore
                    !swapPath.value[tokenInAddress][tokenOutAddress].out ||
                    // @ts-ignore
                    !tokenCost.value[tokenInAddress]
                ) {
                    return;
                }

                // @ts-ignore
                const paths = swapPath.value[tokenInAddress][tokenOutAddress].out;
                // @ts-ignore
                const [tradeSwaps, tradeAmount] = sor.value.getOutTrade(
                    tokenOutAmount,
                    paths.pools,
                    paths.paths,
                    paths.epsOfInterest,
                    // @ts-ignore
                    tokenCost.value[tokenInAddress],
                );
                swaps.value = tradeSwaps;
                const tokenInAmountRaw = scale(tradeAmount, -tokenInDecimals);
                const tokenInPrecision = assets[tokenInAddress].precision;
                tokenInAmountInput.value = tokenInAmountRaw.toFixed(tokenInPrecision, BigNumber.ROUND_UP);
            }
        }

        watch(tokenInAddressInput, async () => {
            await updatePaths();
            onAmountChange();
        });

        watch(tokenOutAddressInput, async () => {
            await updatePaths();
            onAmountChange();
        });

        watch(sor, async () => {
            await updatePaths();
            onAmountChange();
        });

        async function handleAmountChange(input: string): Promise<void> {
            activeToken.value = input;
            await updatePaths();
            onAmountChange();
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
            const provider = store.state.account.web3Provider;
            const tokenInAddress = tokenInAddressInput.value;
            const spender = config.addresses.exchangeProxy;
            const tx = await Helper.unlock(provider, tokenInAddress, spender);
            handleTx(tx, 'unlock', {
                token: tokenInAddress,
                spender,
            });
        }

        async function swap(): Promise<void> {
            buttonLoading.value = true;
            const tokenInAddress = tokenInAddressInput.value;
            const tokenOutAddress = tokenOutAddressInput.value;
            const provider = store.state.account.web3Provider;
            if (activeToken.value === 'input') {
                const tokenInAmountNumber = new BigNumber(tokenInAmountInput.value);
                const tokenInDecimals = assets[tokenInAddress].decimals;
                const tokenInAmount = scale(tokenInAmountNumber, tokenInDecimals);
                const minAmount = new BigNumber(0);
                const tx = await Swapper.swapIn(provider, swaps.value, tokenInAddress, tokenOutAddress, tokenInAmount, minAmount);
                handleTx(tx, 'swap', {});
            } else {
                const tokenInAmountNumber = new BigNumber(tokenInAmountInput.value);
                const tokenInDecimals = assets[tokenInAddress].decimals;
                const tokenInAmountMax = scale(tokenInAmountNumber, tokenInDecimals);
                const tx = await Swapper.swapOut(provider, swaps.value, tokenInAddress, tokenOutAddress, tokenInAmountMax);
                handleTx(tx, 'swap', {});
            }
        }

        onMounted(async () => {
            const { assetIn, assetOut } = getInitialPair();
            await fetchTokenMetadata(assetIn, assetOut);
            tokenInAddressInput.value = assetIn;
            tokenOutAddressInput.value = assetOut;

            const provider = store.getters['account/provider'];
            const multicallAddress = config.addresses.multicall;
            const subgraphUrl = config.subgraphUrl;

            const sorInstance = new SOR(
                new BigNumber(APP_GAS_PRICE),
                new BigNumber(APP_SWAP_COST),
                parseInt(APP_MAX_POOLS),
                multicallAddress,
                subgraphUrl,
                provider,
            );
            await sorInstance.fetchPools();
            // @ts-ignore
            sor.value = sorInstance;
        });

        async function handleTx(tx: any, txType: string, txMeta: any): Promise<void> {
            if (tx instanceof CancelledTransaction) {
                buttonLoading.value = false;
                return;
            }
            store.dispatch('account/saveTransaction', tx);
            const minedTx = await tx.wait(1);
            buttonLoading.value = false;
            notify(minedTx, txType);
            updateState(minedTx, txType, txMeta);
        }

        async function notify(minedTx: any, txType: string): Promise<void> {
            store.dispatch('account/updateTransaction', minedTx);
            const type = minedTx.status === 1
                ? 'success'
                : 'error';
            const text = txType === 'swap'
                ? type === 'success'
                    ? 'Swap completed'
                    : 'Swap failed'
                : type === 'success'
                    ? 'Unlock completed'
                    : 'Unlock failed';
            const txHash = minedTx.transactionHash;
            store.dispatch('ui/notify', {
                text,
                type,
                txHash,
            });
        }

        async function updateState(minedTx: any, txType: string, txMeta: any): Promise<void> {
            if (minedTx.status !== 1) {
                return;
            }
            if (txType === 'unlock') {
                store.dispatch('account/unlock', txMeta);
            }
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
            let assetIn = router.currentRoute.value.params.assetIn as string;
            let assetOut = router.currentRoute.value.params.assetOut as string;
            if (!assetIn || !assetOut) {
                return {
                    assetIn: getAssetAddressBySymbol(assets, 'ETH'),
                    assetOut: getAssetAddressBySymbol(assets, 'USDC'),
                };
            }
            if (isAddress(assetIn)) {
                assetIn = ethers.utils.getAddress(assetIn);
            }
            if (isAddress(assetOut)) {
                assetOut = ethers.utils.getAddress(assetOut);
            }
            return {
                assetIn,
                assetOut,
            };
        }

        return {
            sor,
            swaps,
            tokenCost,
            swapPath,

            activeToken,
            tokenInAddressInput,
            tokenInAmountInput,
            tokenOutAddressInput,
            tokenOutAmountInput,
            buttonLoading,
            isModalOpen,
            isUnlocked,
            isLoading,
            isDisabled,
            account,
            statusLabel,

            chevronIcon,

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
