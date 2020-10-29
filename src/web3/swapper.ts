import BigNumber from 'bignumber.js';
import { Contract } from '@ethersproject/contracts';
import { ErrorCode } from '@ethersproject/logger';
import { Web3Provider } from '@ethersproject/providers';
import { Swap } from '@balancer-labs/sor/dist/types';

import ExchangeProxyABI from '../abi/ExchangeProxy.json';

import config from '@/config';
import { logRevertedTx } from '@/utils/helpers';
import { ETH_KEY } from '@/utils/assets';

const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const exchangeProxyAddress = config.addresses.exchangeProxy;

export default class Swapper {
    static async swapIn(
        provider: Web3Provider,
        swaps: Swap[][],
        tokenInAddress: string,
        tokenOutAddress: string,
        tokenInAmount: BigNumber,
        tokenOutAmountMin: BigNumber,
    ): Promise<any> {
        const overrides: any = {};
        if (tokenInAddress === ETH_KEY) {
            tokenInAddress = ETH_ADDRESS;
            overrides.value = `0x${tokenInAmount.toString(16)}`;
        }
        if (tokenOutAddress === ETH_KEY) {
            tokenOutAddress = ETH_ADDRESS;
        }
        const exchangeProxyContract = new Contract(exchangeProxyAddress, ExchangeProxyABI, provider.getSigner());
        try {
            return await exchangeProxyContract.multihopBatchSwapExactIn(
                swaps,
                tokenInAddress,
                tokenOutAddress,
                tokenInAmount.toString(),
                tokenOutAmountMin.toString(),
                overrides,
            );
        } catch(e) {
            if (e.code === ErrorCode.UNPREDICTABLE_GAS_LIMIT) {
                const sender = await provider.getSigner().getAddress();
                logRevertedTx(
                    sender,
                    exchangeProxyContract,
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
            return e;
        }
    }

    static async swapOut(
        provider: Web3Provider,
        swaps: Swap[][],
        tokenInAddress: string,
        tokenOutAddress: string,
        tokenInAmountMax: BigNumber,
    ): Promise<any> {
        const overrides: any = {};
        if (tokenInAddress === ETH_KEY) {
            tokenInAddress = ETH_ADDRESS;
            overrides.value = `0x${tokenInAmountMax.toString(16)}`;
        }
        if (tokenOutAddress === ETH_KEY) {
            tokenOutAddress = ETH_ADDRESS;
        }
        const exchangeProxyContract = new Contract(exchangeProxyAddress, ExchangeProxyABI, provider.getSigner());
        try {
            return await exchangeProxyContract.multihopBatchSwapExactOut(
                swaps,
                tokenInAddress,
                tokenOutAddress,
                tokenInAmountMax.toString(),
                overrides,
            );
        } catch(e) {
            if (e.code === ErrorCode.UNPREDICTABLE_GAS_LIMIT) {
                const sender = await provider.getSigner().getAddress();
                logRevertedTx(
                    sender,
                    exchangeProxyContract,
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
            return e;
        }
    }
}
