import BigNumber from 'bignumber.js';
import { Pool } from '@balancer-labs/sor/dist/types';
import { calcSpotPrice } from '@/utils/math';

const ENDPOINT_PRICE_USD = 'https://api.coingecko.com/api/v3';

export async function getPrices(tokens: string[]): Promise<Record<string, number>> {
    const tokenString = tokens.join(',');
    const url = `${ENDPOINT_PRICE_USD}/simple/price?ids=${tokenString}&vs_currencies=usd`;
    const response = await fetch(url);
    const data = await response.json();
    const prices = Object.fromEntries(Object.entries(data).map((priceEntry) => {
        const id = priceEntry[0];
        const priceResult: any = priceEntry[1];
        return [id, priceResult.usd];
    }));
    return prices;
}

export async function getTokenPriceUSD(
    token: string,
): Promise<any> {
    let data;
    try {
        const url = `${ENDPOINT_PRICE_USD}/simple/price?ids=${token}&vs_currencies=usd`;
        const response = await fetch(url);
        data = await response.json();
        return data['weth'].usd;
    } catch (e) {
        console.error('error: getPriceUSD: ', e);
        return;
    }
}

// TODO: convert for any pool, with/w/o fees
export function getBALETHSpotPrice(rawPool: Pool): any {
    try {
        const balWethPool = {
            tokens: rawPool.tokens
                .map(token => {
                    return {
                        balance: new BigNumber(token.balance),
                        weight: new BigNumber(token.denormWeight),
                    };
                }),
        };

        const spotPrice = calcSpotPrice(
            balWethPool.tokens[1].balance,
            balWethPool.tokens[1].weight,
            balWethPool.tokens[0].balance,
            balWethPool.tokens[0].weight,
        ).div(1e18);

        return spotPrice;
    }
    catch (e) {
        console.error('error: getting bal spot price: ', e);
    }
}