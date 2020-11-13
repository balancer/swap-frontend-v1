import homesteadAssets from '@balancer-labs/assets/generated/dex/registry.homestead.json';
import kovanAssets from '@balancer-labs/assets/generated/dex/registry.kovan.json';

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
    logoUrl: string;
}

interface Config {
    network: string;
    chainId: number;
    precision: number;
    subgraphUrl: string;
    alchemyUrl: string;
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
    1: {...homesteadAssets, ...homestead},
    42:{...kovanAssets, ...kovan},
};
// eslint-disable-next-line no-undef
const network = process.env.APP_CHAIN_ID || 1;

const config: Config = configs[network];

export default config;
