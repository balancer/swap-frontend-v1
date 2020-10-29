import BigNumber from 'bignumber.js';
import { Swap, PoolPairData, Pool } from '@balancer-labs/sor/dist/types';

export function getSlippage(pools: Pool[], swaps: Swap[][], isExactIn: boolean, tokenInAmount: BigNumber, tokenOutAmount: BigNumber): BigNumber {
    let spotAmount = new BigNumber(0);
    for (let i = 0; i < swaps.length; i++) {
        const swap = swaps[i];
        const spotPrices = [];

        for (let j = 0; j < swap.length; j++) {
            const swapLeg = swap[j];
            const poolPair = getPoolPair(pools, swapLeg.pool, swapLeg.tokenIn, swapLeg.tokenOut);
            if (!poolPair) {
                continue;
            }
            const spotPrice = getSpotPrice(poolPair);
            spotPrices.push(spotPrice);
        }

        const spotPrice = spotPrices.reduce((a, b) => a.times(b));
        if (isExactIn) {
            const swapAmount = new BigNumber(swap[0].swapAmount as string);
            spotAmount = spotAmount.plus(swapAmount.div(spotPrice));
        } else {
            const swapAmount = swap.length === 1
                ? new BigNumber(swap[0].swapAmount as string)
                : new BigNumber(swap[1].swapAmount as string);
            spotAmount = spotAmount.plus(swapAmount.times(spotPrice));
        }
    }
    const one = new BigNumber(1);
    const expectedSlippage = isExactIn
        ? one.minus(tokenOutAmount.div(spotAmount))
        : one.minus(spotAmount.div(tokenInAmount));
    return expectedSlippage;
}

function getSpotPrice(poolPair: PoolPairData): BigNumber {
    const one = new BigNumber('1e18');
    const poolSwapFee = new BigNumber(poolPair.swapFee);
    const numer = poolPair.balanceIn.div(poolPair.weightIn);
    const denom = poolPair.balanceOut.div(poolPair.weightOut);
    const ratio = numer.div(denom);
    const scale = one.div(one.minus(poolSwapFee));
    return ratio.times(scale);
}

function getPoolPair(pools: Pool[], poolId: string, tokenInAddress: string, tokenOutAddress: string): PoolPairData | undefined {
    const pool = pools.find(p => p.id === poolId);
    if (!pool) {
        return;
    }

    const tokenIn = pool.tokens.find(token => token.address === tokenInAddress);
    const tokenOut = pool.tokens.find(token => token.address === tokenOutAddress);
    if (!tokenIn || !tokenOut) {
        return;
    }

    return {
        id: pool.id,
        swapFee: pool.swapFee,
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        balanceIn: tokenIn.balance,
        balanceOut: tokenOut.balance,
        weightIn: tokenIn.denormWeight,
        weightOut: tokenOut.denormWeight,
    };
}