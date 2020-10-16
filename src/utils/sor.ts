import {
    filterPools,
    sortPoolsMostLiquid,
    getAllPoolDataOnChain,
    processPaths,
    parsePoolData,
    smartOrderRouterMultiHopEpsOfInterest,
    processEpsOfInterestMultiHop,
    getCostOutputToken,
} from '@balancer-labs/sor';
import BigNumber from 'bignumber.js';
// @ts-ignore
import cloneDeep from 'lodash/cloneDeep';

import config from '@/config';
// @ts-ignore
import pools from '@/pools.json';

export default class SOR {
    allPools: any[];
    gasPrice: BigNumber;
    swapGasCost: BigNumber;
    maxPoolCount: number;
    multicallAddress: string;
    subgraphUrl: string;
    provider: any;

    constructor(
        gasPrice: BigNumber,
        swapGasCost: BigNumber,
        maxPoolCount: number,
        multicallAddress: string,
        subgraphUrl: string,
        provider: any,
    ) {
        this.allPools = [];
        this.gasPrice = gasPrice;
        this.swapGasCost = swapGasCost;
        this.maxPoolCount = maxPoolCount;
        this.multicallAddress = multicallAddress;
        this.subgraphUrl = subgraphUrl;
        this.provider = provider;
    }

    async fetchPools(): Promise<void> {
        let subgraphPools = await getAllPublicSwapPools(this.subgraphUrl);
        if (!subgraphPools) {
            subgraphPools = {
                pools: pools[config.chainId],
            };
        }
        let onchainPools;
        while (!onchainPools) {
            try {
                // @ts-ignore
                onchainPools = await getAllPoolDataOnChain(
                    subgraphPools,
                    this.multicallAddress,
                    this.provider,
                );
            } catch(e) {
                console.log('Could not fetch onchain pool data, retrying…', e);
            }
        }
        // @ts-ignore
        this.allPools = onchainPools;
    }

    async getTokenCost(token: string): Promise<any> {
        return await getCostOutputToken(
            token,
            this.gasPrice,
            this.swapGasCost,
            this.provider,
        );
    }

    getInPath(tokenIn: string, tokenOut: string): any {
        const [processedPools, pathData] = loadPathData(
            this.allPools,
            tokenIn,
            tokenOut,
        );
        const processedPathsIn = processPaths(pathData, processedPools, 'swapExactIn');

        const epsOfInterestIn = processEpsOfInterestMultiHop(
            processedPathsIn,
            'swapExactIn',
            this.maxPoolCount,
        );


        return {
            pools: processedPools,
            paths: processedPathsIn,
            epsOfInterest: epsOfInterestIn,
        };
    }

    getOutPath(tokenIn: string, tokenOut: string): any {
        const [processedPools, pathData] = loadPathData(
            this.allPools,
            tokenIn,
            tokenOut,
        );
        const processedPathsOut = processPaths(pathData, processedPools, 'swapExactOut');

        const epsOfInterestOut = processEpsOfInterestMultiHop(
            processedPathsOut,
            'swapExactOut',
            this.maxPoolCount,
        );

        return {
            pools: processedPools,
            paths: processedPathsOut,
            epsOfInterest: epsOfInterestOut,
        };
    }

    getInTrade(
        tokenAmountIn: BigNumber,
        processedPools: any,
        processedPathsIn: any,
        epsOfInterestIn: any,
        tokenCostOut: BigNumber,
    ): any {
        const processedPoolsCopy = cloneDeep(processedPools);
        const [sorSwaps, amountOut] = smartOrderRouterMultiHopEpsOfInterest(
            processedPoolsCopy,
            processedPathsIn,
            'swapExactIn',
            tokenAmountIn,
            this.maxPoolCount,
            tokenCostOut,
            epsOfInterestIn,
        );

        return [sorSwaps, amountOut];
    }

    getOutTrade(
        tokenAmountOut: BigNumber,
        processedPools: any,
        processedPathsOut: any,
        epsOfInterestOut: any,
        tokenCostIn: BigNumber,
    ): any {
        const processedPoolsCopy = cloneDeep(processedPools);
        const [sorSwaps, amountOut] = smartOrderRouterMultiHopEpsOfInterest(
            processedPoolsCopy,
            processedPathsOut,
            'swapExactOut',
            tokenAmountOut,
            this.maxPoolCount,
            tokenCostIn,
            epsOfInterestOut,
        );

        return [sorSwaps, amountOut];
    }
}

async function getAllPublicSwapPools(subgraphUrl: string): Promise<any> {
    const query = `
        {
            pools (first: 1000, where: {publicSwap: true, active: true}) {
                id
                swapFee
                totalWeight
                tokens {
                    address
                }
                tokensList
            }
        }
    `;

    const response = await fetch(subgraphUrl, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
        }),
    });

    const { data } = await response.json();
    return data;
}

function loadPathData(
    allPools: any,
    tokenIn: string,
    tokenOut: string,
): any[] {
    tokenIn = tokenIn.toLowerCase();
    tokenOut = tokenOut.toLowerCase();

    const [directPools, hopTokens, poolsTokenIn, poolsTokenOut] = filterPools(
        allPools.pools,
        tokenIn,
        tokenOut,
    );

    const [
        mostLiquidPoolsFirstHop,
        mostLiquidPoolsSecondHop,
    ] = sortPoolsMostLiquid(
        tokenIn,
        tokenOut,
        hopTokens,
        poolsTokenIn,
        poolsTokenOut,
    );

    const [pools, pathData] = parsePoolData(
        directPools,
        tokenIn,
        tokenOut,
        mostLiquidPoolsFirstHop,
        mostLiquidPoolsSecondHop,
        hopTokens,
    );

    return [pools, pathData];
}
