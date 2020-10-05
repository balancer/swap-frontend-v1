<template>
    <div>
        <div class="pair">
            <div>
                <AssetInput
                    v-model:address="tokenInAddressInput"
                    v-model:amount="tokenInAmountInput"
                    @change="setActiveToken('input')"
                />
            </div>
            <div>
                ↓
            </div>
            <div>
                <AssetInput
                    v-model:address="tokenOutAddressInput"
                    v-model:amount="tokenOutAmountInput"
                    @change="setActiveToken('output')"
                />
            </div>
            <div class="swap-button-wrapper">
                <Button
                    :text="'Swap'"
                    @click="swap"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { ref, defineComponent, onMounted, watch, computed } from 'vue';
import { useStore } from 'vuex';
import BigNumber from 'bignumber.js';

import { scale } from '@/utils/helpers';
import SOR from '@/utils/sor';
import Swapper from '@/web3/swapper';
import { getAssetAddressBySymbol } from '@/utils/assets';

import AssetInput from '@/components/AssetInput.vue';
import Button from '@/components/Button.vue';

export default defineComponent({
    components: {
        AssetInput,
        Button,
    },
    setup() {
        const store = useStore();
        const assets = store.state.assets.metadata;

        const activeToken = ref('input');
        const tokenCost = ref({});
        const swapPath = ref({});
        const tokenInAddressInput = ref('');
        const tokenInAmountInput = ref('10');
        const tokenOutAddressInput = ref('');
        const tokenOutAmountInput = ref('…');
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
            const tokenInAddress = tokenInAddressInput.value;
            const tokenOutAddress = tokenOutAddressInput.value;
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

            const tokenInAddress = tokenInAddressInput.value;
            const tokenOutAddress = tokenOutAddressInput.value;
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
                    tokenOutAmountInput.value = '…';
                    return;
                } else {
                    tokenInAmountInput.value = '…';
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
                    tokenOutAmountInput.value = '…';
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
                tokenOutAmountInput.value = tokenOutAmountRaw.toString();
            } else {
                if (
                    // @ts-ignore
                    !swapPath.value[tokenInAddress][tokenOutAddress].out ||
                    // @ts-ignore
                    !tokenCost.value[tokenInAddress]
                ) {
                    tokenInAmountInput.value = '…';
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
                tokenInAmountInput.value = tokenInAmountRaw.toString();
            }
        }

        watch(tokenInAddressInput, async () => {
            await updatePaths();
            onAmountChange();
        });

        watch(tokenInAmountInput, async () => {
            if (activeToken.value !== 'input') {
                return;
            }
            await updatePaths();
            onAmountChange();
        });

        watch(tokenOutAddressInput, async () => {
            await updatePaths();
            onAmountChange();
        });

        watch(tokenOutAmountInput, async () => {
            if (activeToken.value !== 'output') {
                return;
            }
            await updatePaths();
            onAmountChange();
        });

        watch(sor, async () => {
            await updatePaths();
            onAmountChange();
        });

        function setActiveToken(input: string): void {
            activeToken.value = input;
            updatePaths();
        }

        async function connect(): Promise<void> {
            store.dispatch('account/connect', 'injected');
        }

        async function disconnect(): Promise<void> {
            store.dispatch('account/disconnect');
        }

        function swap(): void {
            const tokenInAddress = tokenInAddressInput.value;
            const tokenOutAddress = tokenOutAddressInput.value;
            const provider = store.state.account.web3Provider;
            if (activeToken.value === 'input') {
                const tokenInAmountNumber = new BigNumber(tokenInAmountInput.value);
                const tokenInDecimals = assets[tokenInAddress].decimals;
                const tokenInAmount = scale(tokenInAmountNumber, tokenInDecimals);
                const minAmount = new BigNumber(0);
                Swapper.swapIn(provider, swaps.value, tokenInAddress, tokenOutAddress, tokenInAmount, minAmount);
            } else {
                const tokenInAmountNumber = new BigNumber(tokenInAmountInput.value);
                const tokenInDecimals = assets[tokenInAddress].decimals;
                const tokenInAmountMax = scale(tokenInAmountNumber, tokenInDecimals);
                Swapper.swapOut(provider, swaps.value, tokenInAddress, tokenOutAddress, tokenInAmountMax);
            }
        }

        onMounted(async () => {
            tokenInAddressInput.value = getAssetAddressBySymbol(assets, 'DAI');
            tokenOutAddressInput.value = getAssetAddressBySymbol(assets, 'WETH');

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
            tokenInAddressInput,
            tokenInAmountInput,
            tokenOutAddressInput,
            tokenOutAmountInput,
            account,
            setActiveToken,
            connect,
            disconnect,
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
    display: flex;
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
