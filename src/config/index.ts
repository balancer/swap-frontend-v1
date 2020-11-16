import tokenlist from './listed.tokenlist.json';
import homestead from './homestead.json';
import kovan from './kovan.json';

interface Connector {
    id: string;
    name: string;
    options: any;
}

export interface TokenMetadata {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string | undefined;
}

interface Config {
    network: string;
    chainId: number;
    precision: number;
    alchemyKey: string;
    subgraphUrl: string;
    subgraphBackupUrl: string;
    addresses: {
        bFactory: string;
        bActions: string;
        dsProxyRegistry: string;
        exchangeProxy: string;
        weth: string;
        multicall: string;
    };
    tokens: Record<string, TokenMetadata>;
    untrusted: string[];
    connectors: Record<string, Connector>;
}

const configs = {
    1: {
        tokens: getTokensFromTokenlist(1),
        untrusted: [],
        ...homestead,
    },
    42:{
        tokens: getTokensFromTokenlist(42),
        untrusted: [],
        ...kovan,
    },
};
// eslint-disable-next-line no-undef
const network = process.env.APP_CHAIN_ID || 1;

const config: Config = configs[network];

function getTokensFromTokenlist(chainId: number): Record<string, TokenMetadata> {
    const tokens = {
        ether: {
            address: 'ether',
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
            logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        },
    };
    for (const token of tokenlist.tokens) {
        if (token.chainId !== chainId) {
            continue;
        }
        tokens[token.address] = {
            address: token.address,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
            logoURI: token.logoURI,
        };
    }
    return tokens;
}

export default config;
