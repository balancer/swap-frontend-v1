import tokenlist from '../config/listed.tokenlist.json';
import config, { AssetMetadata } from '@/config';

const ETH_LOGO = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png';

interface Token {
    address: string;
    chainId: number;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
}

interface TokenList {
    name: string;
    tokens: Token[];
}

interface List {
    url: string;
    logoURI: string;
    name: string;
}

const lists: Record<string, List> = {
    'balancer': {
        url: '',
        logoURI: '',
        name: 'Balancer',
    },
    '1inch': {
        url: 'http://tokens.1inch.eth.link',
        logoURI: 'https://1inch.exchange/assets/images/logo.png',
        name: '1inch',
    },
    'aave': {
        url: 'http://tokenlist.aave.eth.link',
        logoURI: 'ipfs://QmWzL3TSmkMhbqGBEwyeFyWVvLmEo3F44HBMFnmTUiTfp1',
        name: 'Aave',
    },
    'coingecko': {
        url: 'https://tokens.coingecko.com/uniswap/all.json',
        logoURI: 'https://www.coingecko.com/assets/thumbnail-007177f3eca19695592f0b8b0eabbdae282b54154e1be912285c9034ea6cbaf2.png',
        name: 'Coingecko',
    },
    'cmc': {
        url: 'http://defi.cmc.eth.link',
        logoURI: 'ipfs://QmQAGtNJ2rSGpnP6dh6PPKNSmZL8RTZXmgFwgTdy5Nz5mx',
        name: 'CoinMarketCap',
    },
    'compound': {
        url: 'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
        logoURI: 'https://raw.githubusercontent.com/compound-finance/token-list/master/assets/compound-interface.svg',
        name: 'Compound',
    },
    'uma': {
        url: 'https://umaproject.org/uma.tokenlist.json',
        logoURI: 'https://umaproject.org/assets/images/UMA_square_red_logo_circle.png',
        name: 'UMA',
    },
    'zapper': {
        url: 'https://zapper.fi/api/token-list',
        logoURI: 'https://zapper.fi/logo192.png',
        name: 'Zapper',
    },
    'zerion': {
        url: 'http://tokenlist.zerion.eth.link',
        logoURI: 'https://token-icons.s3.amazonaws.com/brand/1_z-white_blue-rounded-square.png',
        name: 'Zerion',
    },
};

export async function getAssetsFromTokenlist(chainId: number, listId: string): Promise<Record<string, AssetMetadata>> {
    const list = await getTokenlist(listId);
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

async function getTokenlist(id: string): Promise<TokenList> {
    if (id === 'balancer') {
        return tokenlist;
    }
    const list = getList(id);
    const response = await fetch(list.url);
    const json = await response.json();
    return json;
}

function getList(id: string): List {
    return lists[id];
}
