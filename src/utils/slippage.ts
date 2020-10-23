import BigNumber from 'bignumber.js';

import { scale } from '@/utils/helpers';

export function getSlippage(pools: any, swaps: any[], isExactIn: boolean, tokenInAmount: BigNumber, tokenOutAmount: BigNumber): BigNumber {
    let spotAmount = new BigNumber(0);
    for (let i = 0; i < swaps.length; i++) {
        const swap = swaps[i];
        const spotPrices = [];

        for (let j = 0; j < swap.length; j++) {
            const swapLeg = swap[j];
            const poolPair = getPoolPair(pools, swapLeg.pool, swapLeg.tokenIn, swapLeg.tokenOut);
            const spotPrice = getSpotPrice(poolPair);
            spotPrices.push(spotPrice);
        }

        const spotPrice = spotPrices.reduce((a, b) => a.times(b));
        if (isExactIn) {
            const swapAmount = new BigNumber(swap[0].swapAmount);
            spotAmount = spotAmount.plus(swapAmount.div(spotPrice));
        } else {
            const swapAmount = swap.length === 1
                ? new BigNumber(swap[0].swapAmount)
                : new BigNumber(swap[1].swapAmount);

            spotAmount = spotAmount.plus(swapAmount.times(spotPrice));
        }
    }
    const amountDifference = isExactIn
        ? spotAmount.minus(tokenOutAmount)
        : tokenInAmount.minus(spotAmount);
    const expectedSlippage = amountDifference.div(spotAmount);
    return expectedSlippage;
}

function getSpotPrice(poolPair: any): BigNumber {
    const one = new BigNumber('1e18');
    const poolSwapFee = new BigNumber(poolPair.swapFee);
    const numer = poolPair.balanceIn.div(poolPair.weightIn);
    const denom = poolPair.balanceOut.div(poolPair.weightOut);
    const ratio = numer.div(denom);
    const scale = one.div(one.minus(poolSwapFee));
    return ratio.times(scale);
}

function getPoolPair(pools: any[], poolId: string, tokenInAddress: string, tokenOutAddress: string): any {
    const pool = pools.find(p => p.id === poolId);

    const tokenIn: any = pool.tokens.find((token: any) => token.address === tokenInAddress);
    const tokenOut: any = pool.tokens.find((token: any) => token.address === tokenOutAddress);

    const { id, swapFee } = pool;
    const balanceIn = scale(new BigNumber(tokenIn.balance), tokenIn.decimals);
    const balanceOut = scale(new BigNumber(tokenOut.balance), tokenOut.decimals);
    const weightIn = new BigNumber(tokenIn.denormWeight);
    const weightOut = new BigNumber(tokenOut.denormWeight);

    return {
        id,
        swapFee,
        balanceIn,
        balanceOut,
        weightIn,
        weightOut,
    };
}