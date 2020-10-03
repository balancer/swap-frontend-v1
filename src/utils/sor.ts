import {
    filterPoolsWithTokensDirect,
    filterPoolsWithTokensMultihop,
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

// eslint-disable-next-line no-undef
const SUBGRAPH_URL = process.env.REACT_APP_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer';
const multiAddress = '0xeefba1e63905ef1d7acba5a8513c70307c1ce441';

export default class SOR {
    allPools: any;
    gasPrice: any;
    swapGasCost: any;
    maxPoolCount: any;
    provider: any;

    constructor(
        allPools: any[],
        gasPrice: BigNumber,
        swapGasCost: BigNumber,
        maxPoolCount: number,
        provider: any,
    ) {
        this.allPools = allPools;
        this.gasPrice = gasPrice;
        this.swapGasCost = swapGasCost;
        this.maxPoolCount = maxPoolCount;
        this.provider = provider;
    }

    static async fetchPools(provider: any): Promise<any> {
        const subgraphPools = await getAllPublicSwapPools();
        const onchainPools = await getAllPoolDataOnChain(
            subgraphPools,
            multiAddress,
            provider,
        );
        return onchainPools;
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

async function getAllPublicSwapPools(): Promise<any> {
    const pools = await getSubgraphPools();
    return pools;
}

async function getSubgraphPools(): Promise<any> {
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

    const response = await fetch(SUBGRAPH_URL, {
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

    const directPools = filterPoolsWithTokensDirect(
        allPools.pools,
        tokenIn,
        tokenOut,
    );

    const [
        mostLiquidPoolsFirstHop,
        mostLiquidPoolsSecondHop,
        hopTokens,
    ] = filterPoolsWithTokensMultihop(allPools.pools, tokenIn, tokenOut);

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
