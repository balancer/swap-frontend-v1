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
                    @change="handleAmountChange('output')"
                />
            </div>
            <div class="swap-button-wrapper">
                <Button
                    v-if="isUnlocked"
                    :text="'Swap'"
                    :primary="true"
                    @click="swap"
                />
                <Button
                    v-else
                    :text="'Unlock & Swap'"
                    :primary="true"
                    @click="unlockSwap"
                />
            </div>
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
import BigNumber from 'bignumber.js';

import chevronIcon from '@/assets/chevronIcon.svg';

import config from '@/config';
import { scale } from '@/utils/helpers';
import SOR from '@/utils/sor';
import { getAssetAddressBySymbol } from '@/utils/assets';
import Swapper from '@/web3/swapper';
import Helper from '@/web3/helper';

import AssetInput from '@/components/AssetInput.vue';
import Button from '@/components/Button.vue';
import ModalAssetSelector from '@/components/ModalAssetSelector.vue';

export default defineComponent({
    components: {
        AssetInput,
        Button,
        ModalAssetSelector,
    },
    setup() {
        const store = useStore();
        const assets = store.state.assets.metadata;
        const { allowances } = store.state.account;

        const activeToken = ref('input');
        const tokenCost = ref({});
        const swapPath = ref({});
        const tokenInAddressInput = ref('');
        const tokenInAmountInput = ref('10');
        const tokenOutAddressInput = ref('');
        const tokenOutAmountInput = ref('…');

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
        const isModalOpen = computed(() => store.state.ui.modal.asset.isOpen);
        
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
                const tokenOutPrecision = assets[tokenOutAddress].precision;
                tokenOutAmountInput.value = tokenOutAmountRaw.toFixed(tokenOutPrecision);
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
                const tokenInPrecision = assets[tokenInAddress].precision;
                tokenInAmountInput.value = tokenInAmountRaw.toFixed(tokenInPrecision);
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

        async function unlockSwap(): Promise<void> {
            const provider = store.state.account.web3Provider;
            const tokenInAddress = tokenInAddressInput.value;
            const spender = config.addresses.exchangeProxy;
            await Helper.unlock(provider, tokenInAddress, spender);
            await swap();
        }

        async function swap(): Promise<void> {
            const tokenInAddress = tokenInAddressInput.value;
            const tokenOutAddress = tokenOutAddressInput.value;
            const provider = store.state.account.web3Provider;
            if (activeToken.value === 'input') {
                const tokenInAmountNumber = new BigNumber(tokenInAmountInput.value);
                const tokenInDecimals = assets[tokenInAddress].decimals;
                const tokenInAmount = scale(tokenInAmountNumber, tokenInDecimals);
                const minAmount = new BigNumber(0);
                await Swapper.swapIn(provider, swaps.value, tokenInAddress, tokenOutAddress, tokenInAmount, minAmount);
            } else {
                const tokenInAmountNumber = new BigNumber(tokenInAmountInput.value);
                const tokenInDecimals = assets[tokenInAddress].decimals;
                const tokenInAmountMax = scale(tokenInAmountNumber, tokenInDecimals);
                await Swapper.swapOut(provider, swaps.value, tokenInAddress, tokenOutAddress, tokenInAmountMax);
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
            chevronIcon,
            sor,

            activeToken,
            tokenInAddressInput,
            tokenInAmountInput,
            tokenOutAddressInput,
            tokenOutAmountInput,
            isUnlocked,
            isModalOpen,

            account,

            handleAmountChange,
            handleAssetSelect,
            connect,
            disconnect,
            togglePair,
            unlockSwap,
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

.swap-button-wrapper {
    margin-top: 32px;
}
</style>
