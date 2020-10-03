<template>
    <div>
        <div class="header">
            <h1>Balancer DEX</h1>
            <div>
                <span v-if="account">
                    {{ account }}
                    <span @click="disconnect">x</span>
                </span>
                <button
                    v-else
                    @click="connect"
                >
                    Connect
                </button>
            </div>
        </div>
        <div class="pair">
            <div>
                <input
                    v-model="inputAmount"
                    @focus="setActiveInput('input')"
                >
                <select
                    v-model="inputToken"
                    class="token-selector"
                >
                    <option>DAI</option>
                    <option>USDC</option>
                    <option>ETH</option>
                    <option>WETH</option>
                    <option>WBTC</option>
                    <option>BAL</option>
                </select>
            </div>
            <div>
                ↓
            </div>
            <div>
                <input
                    v-model="outputAmount"
                    @focus="setActiveInput('output')"
                >
                <select
                    v-model="outputToken"
                    class="token-selector"
                >
                    <option>DAI</option>
                    <option>USDC</option>
                    <option>ETH</option>
                    <option>WETH</option>
                    <option>WBTC</option>
                    <option>BAL</option>
                </select>
            </div>
            <div class="swap-button-wrapper">
                <button @click="swap">
                    Swap
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { ref, defineComponent, onMounted, watch, computed } from 'vue';
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';

import { scale } from '../utils/helpers';
import SOR from '../utils/sor';
import Swapper from '../web3/swapper';
import { getTokenAddress, getTokenDecimals } from '../utils/tokens';

export default defineComponent({
    setup() {
        const store = useStore();

        const activeInput = ref('input');
        const tokenCost = ref({});
        const swapPath = ref({});
        const inputToken = ref('DAI');
        const inputAmount = ref('10');
        const outputToken = ref('WETH');
        const outputAmount = ref('…');
        const sor = ref(null);
        const swaps = ref([]);

        const account = computed(() => {
            const { web3Provider, address } = store.state.account;
            if (!web3Provider || !address) {
                return '';
            }
            return address;
        });

        async function updatePaths(): Promise<void> {
            if (!sor.value) {
                return;
            }
            const tokenInSymbol = inputToken.value;
            const tokenOutSymbol = outputToken.value;
            const tokenInAddress = tokenInSymbol === 'ETH'
                ? getTokenAddress('WETH')
                : getTokenAddress(tokenInSymbol);
            const tokenOutAddress = tokenOutSymbol === 'ETH'
                ? getTokenAddress('WETH')
                : getTokenAddress(tokenOutSymbol);
            if (activeInput.value === 'input') {
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
            const isInputActive = activeInput.value === 'input';
            if (isInputActive) {
                if (inputAmount.value === '') {
                    outputAmount.value = '';
                    return;
                }
            } else {
                if (outputAmount.value === '') {
                    inputAmount.value = '';
                    return;
                }
            }

            const tokenInSymbol = inputToken.value;
            const tokenOutSymbol = outputToken.value;
            const tokenInAddress = tokenInSymbol === 'ETH'
                ? getTokenAddress('WETH')
                : getTokenAddress(tokenInSymbol);
            const tokenOutAddress = tokenOutSymbol === 'ETH'
                ? getTokenAddress('WETH')
                : getTokenAddress(tokenOutSymbol);
            const tokenInDecimals = getTokenDecimals(tokenInAddress);
            const tokenOutDecimals = getTokenDecimals(tokenOutAddress);

            const tokenInAmountRaw = new BigNumber(inputAmount.value);
            const tokenInAmount = scale(tokenInAmountRaw, tokenInDecimals);
            const tokenOutAmountRaw = new BigNumber(outputAmount.value);
            const tokenOutAmount = scale(tokenOutAmountRaw, tokenOutDecimals);

            if (!sor.value ||
                // @ts-ignore
                !swapPath.value[tokenInAddress] ||
                // @ts-ignore
                !swapPath.value[tokenInAddress][tokenOutAddress]
            ) {
                if (isInputActive) {
                    outputAmount.value = '…';
                    return;
                } else {
                    inputAmount.value = '…';
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
                    outputAmount.value = '…';
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
                outputAmount.value = tokenOutAmountRaw.toString();
            } else {
                if (
                    // @ts-ignore
                    !swapPath.value[tokenInAddress][tokenOutAddress].out ||
                    // @ts-ignore
                    !tokenCost.value[tokenInAddress]
                ) {
                    inputAmount.value = '…';
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
                inputAmount.value = tokenInAmountRaw.toString();
            }
        }

        async function onTokenChange(): Promise<void> {
            if (activeInput.value === 'input') {
                outputAmount.value = '…';
            } else {
                inputAmount.value = '…';
            }
            await updatePaths();
            onAmountChange();
        }

        watch(inputToken, () => {
            onTokenChange();
        });

        watch(inputAmount, () => {
            onAmountChange();
        });

        watch(outputToken, () => {
            onTokenChange();
        });

        watch(outputAmount, () => {
            onAmountChange();
        });

        watch(sor, async () => {
            await updatePaths();
            onAmountChange();
        });

        function setActiveInput(input: string): void {
            activeInput.value = input;
            updatePaths();
        }

        async function connect(): Promise<void> {
            store.dispatch('account/connect', 'injected');
        }

        async function disconnect(): Promise<void> {
            store.dispatch('account/disconnect');
        }

        function swap(): void {
            const tokenIn = getTokenAddress(inputToken.value);
            const tokenOut = getTokenAddress(outputToken.value);
            const provider = store.state.account.web3Provider;
            if (activeInput.value === 'input') {
                const inputAmountNumber = new BigNumber(inputAmount.value);
                const tokenInDecimals = getTokenDecimals(tokenIn);
                const tokenAmountIn = scale(inputAmountNumber, tokenInDecimals);
                const minAmount = new BigNumber(0);
                Swapper.swapIn(provider, swaps.value, tokenIn, tokenOut, tokenAmountIn, minAmount);
            } else {
                const inputAmountNumber = new BigNumber(inputAmount.value);
                const tokenInDecimals = getTokenDecimals(tokenIn);
                const tokenInAmountMax = scale(inputAmountNumber, tokenInDecimals);
                Swapper.swapOut(provider, swaps.value, tokenIn, tokenOut, tokenInAmountMax);
            }
        }

        onMounted(async () => {
            const provider = store.getters['account/provider'];
            const allPools = await SOR.fetchPools(provider);
            const gasPrice = new BigNumber(30000000000);
            const swapGasCost = new BigNumber(100000);
            const maxPoolCount = 4;

            // @ts-ignore
            sor.value = new SOR(allPools, gasPrice, swapGasCost, maxPoolCount, provider);
        });

        return {
            sor,
            inputToken,
            inputAmount,
            outputToken,
            outputAmount,
            account,
            setActiveInput,
            connect,
            disconnect,
            swap,
        };
    },
});
</script>

<style scoped>
input {
    font-size: 32px;
    width: 160px;
    border: none;
    border-bottom: 1px solid;
    outline: none;
}

button {
    width: 160px;
    padding: 0 6px;
    color: black;
    font-size: 32px;
    border: 1px solid black;
    outline: none;
}

select {
    width: 160px;
    padding: 0 6px;
    color: black;
    font-size: 32px;
    border: 1px solid black;
    -webkit-appearance: none;
    -moz-appearance: none;
    outline: none;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pair {
    display: flex;
    margin-top: 200px;
    flex-direction: column;
    align-items: center;
}

.token-selector {
    margin-left: 8px;
}

.swap-button-wrapper {
    margin-top: 32px;
}
</style>
