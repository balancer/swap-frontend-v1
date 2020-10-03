import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import ExchangeProxyABI from '../abi/ExchangeProxy.json';

import { ETH_KEY } from '../utils/tokens';

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
            overrides.value = tokenInAmountMax.toString();
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
    const exchangeProxyAddress = '0x3E66B66Fd1d0b02fDa6C811Da9E0547970DB2f21';
    const exchangeProxyContract = new ethers.Contract(exchangeProxyAddress, ExchangeProxyABI, provider.getSigner());
    await exchangeProxyContract[functionName](...params, overrides);
}
