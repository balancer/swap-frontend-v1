import tokenlist from '@balancer-labs/assets/generated/listed.tokenlist.json';

import config, { AssetMetadata } from '@/config';

const ETH_LOGO = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png';

export interface TokenList {
    name: string;
    logoURI?: string;
    tokens: Token[];
}

interface Token {
    address: string;
    chainId: number;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
}

export const DEFAULT_LIST = 'balancer';

export const listMetadata: Record<string, string> = {
    [DEFAULT_LIST]: '',
    '1inch': 'http://tokens.1inch.eth.link',
    'coingecko': 'https://tokens.coingecko.com/uniswap/all.json',
    'compound': 'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
    'zapper': 'https://zapper.fi/api/token-list',
    'zerion': 'http://tokenlist.zerion.eth.link',
};

export async function getTokenlist(id: string): Promise<TokenList> {
    if (id === DEFAULT_LIST) {
        return tokenlist;
    }
    const listUrl = listMetadata[id];
    const response = await fetch(listUrl);
    const json = await response.json();
    return json;
}

export function getAssetsFromTokenlist(chainId: number, list: TokenList): Record<string, AssetMetadata> {
    const assets: Record<string, AssetMetadata> = {};
    if (list.tokens.findIndex(token => token.address === config.addresses.weth) !== -1) {
        assets.ether = {
            address: 'ether',
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
            logoURI: ETH_LOGO,
        };
    }
    for (const token of list.tokens) {
        if (token.chainId !== chainId) {
            continue;
        }
        assets[token.address] = {
            address: token.address,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
            logoURI: token.logoURI,
        };
    }
    return assets;
}
