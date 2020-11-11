import { getAddress } from '@ethersproject/address';

import config from '@/config';

const ENDPOINT = 'https://api.coingecko.com/api/v3';

export default class Coingecko {
    static async fetchPrice(assets: string[]): Promise<Record<string, number>> {
        const contractString = assets.join('%2C');
        let data;
        try {
            const url = `${ENDPOINT}/simple/token_price/ethereum?contract_addresses=${contractString}&vs_currencies=usd`;
            const response = await fetch(url);
            data = await response.json();
        } catch (e) {
            return {};
        }
        const prices = {};
        for (const address in data) {
            const price = data[address].usd;
            prices[getAddress(address)] = price;
        }
        if (prices[config.addresses.weth]) {
            prices['ether'] = prices[config.addresses.weth];
        }
        return prices;
    }
}
