import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import ExchangeProxyABI from '../abi/ExchangeProxy.json';

import config from '@/config';
import { ETH_KEY } from '@/utils/assets';

const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export default class Swapper {
    static async swapIn(
        provider: any,
        swaps: any[][],
        tokenInAddress: string,
        tokenOutAddress: string,
        tokenInAmount: BigNumber,
        tokenOutAmountMin: BigNumber,
    ): Promise<void> {
        const overrides: any = {};
        if (tokenInAddress === ETH_KEY) {
            tokenInAddress = ETH_ADDRESS;
            overrides.value = `0x${tokenInAmount.toString(16)}`;
        }
        if (tokenOutAddress === ETH_KEY) {
            tokenOutAddress = ETH_ADDRESS;
        }
        await sendTransaction(
            provider,
            'multihopBatchSwapExactIn',
            [
                swaps,
                tokenInAddress,
                tokenOutAddress,
                tokenInAmount.toString(),
                tokenOutAmountMin.toString(),
            ],
            overrides,
        );
    }

    static async swapOut(
        provider: any,
        swaps: any[][],
        tokenInAddress: string,
        tokenOutAddress: string,
        tokenInAmountMax: BigNumber,
    ): Promise<void> {
        const overrides: any = {};
        if (tokenInAddress === ETH_KEY) {
            tokenInAddress = ETH_ADDRESS;
            overrides.value = `0x${tokenInAmountMax.toString(16)}`;
        }
        if (tokenOutAddress === ETH_KEY) {
            tokenOutAddress = ETH_ADDRESS;
        }
        await sendTransaction(
            provider,
            'multihopBatchSwapExactOut',
            [
                swaps,
                tokenInAddress,
                tokenOutAddress,
                tokenInAmountMax.toString(),
            ],
            overrides,
        );
    }
}

async function sendTransaction(
    provider: any,
    functionName: string,
    params: any[],
    overrides: any,
): Promise<void> {
    const exchangeProxyAddress = config.addresses.exchangeProxy;
    const exchangeProxyContract = new ethers.Contract(exchangeProxyAddress, ExchangeProxyABI, provider.getSigner());
    await exchangeProxyContract[functionName](...params, overrides);
}
