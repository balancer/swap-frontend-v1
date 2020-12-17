import { Provider, Contract } from 'ethcall';

import dsProxyRegistryAbi from '../abi/DSProxyRegistry.json';
import erc20Abi from '../abi/ERC20.json';

import config, { AssetMetadata } from '@/config';
import { ETH_KEY, getAssetLogo } from '@/utils/helpers';
import provider from '@/utils/provider';

export type Allowances = Record<string, Record<string, string>>;

export type Balances = Record<string, string>;

export interface AccountState {
    allowances: Allowances;
    balances: Balances;
    proxy: string;
}

export default class Ethereum {
    static async fetchAccountState(address: string, assets: string[]): Promise<AccountState> {
        assets = assets.filter(asset => asset !== ETH_KEY);
        const ethcallProvider = new Provider();
        await ethcallProvider.init(provider);
        const calls = [];
        // Fetch balances and allowances
        const exchangeProxyAddress = config.addresses.exchangeProxy;
        for (const assetAddress of assets) {
            const assetContract = new Contract(assetAddress, erc20Abi);
            const balanceCall = assetContract.balanceOf(address);
            const allowanceCall = assetContract.allowance(address, exchangeProxyAddress);
            calls.push(balanceCall);
            calls.push(allowanceCall);
        }
        // Fetch ether balance
        const ethBalanceCall = ethcallProvider.getEthBalance(address);
        calls.push(ethBalanceCall);
        // Fetch proxy
        const dsProxyRegistryAddress = config.addresses.dsProxyRegistry;
        const dsProxyRegistryContract = new Contract(
            dsProxyRegistryAddress,
            dsProxyRegistryAbi,
        );
        const proxyCall = dsProxyRegistryContract.proxies(address);
        calls.push(proxyCall);
        // Fetch data
        const data = await ethcallProvider.all(calls);
        const assetCount = assets.length;
        const allowances = {};
        allowances[exchangeProxyAddress] = {};
        const balances: Record<string, string> = {};
        let i = 0;
        for (const assetAddress of assets) {
            balances[assetAddress] = data[2 * i].toString();
            allowances[exchangeProxyAddress][assetAddress] = data[2 * i + 1].toString();
            i++;
        }
        balances.ether = data[2 * assetCount].toString();
        const proxy = data[2 * assetCount + 1];
        return { allowances, balances, proxy };
    }

    static async fetchAssetMetadata(assets: string[]): Promise<Record<string, AssetMetadata>> {
        const ethcallProvider = new Provider();
        await ethcallProvider.init(provider);
        const calls = [];
        // Fetch asset metadata
        for (const assetAddress of assets) {
            const assetContract = new Contract(assetAddress, erc20Abi);
            const nameCall = assetContract.name();
            const symbolCall = assetContract.symbol();
            const decimalCall = assetContract.decimals();
            calls.push(nameCall);
            calls.push(symbolCall);
            calls.push(decimalCall);
        }
        // Fetch data
        const data = await ethcallProvider.all(calls);
        const metadata: Record<string, AssetMetadata> = {};
        for (let i = 0; i < assets.length; i++) {
            const assetAddress = assets[i];
            const name = data[3 * i];
            const symbol = data[3 * i + 1];
            const decimals = data[3 * i + 2];
            metadata[assetAddress] = {
                address: assetAddress,
                name,
                symbol,
                decimals,
                logoURI: getAssetLogo(assetAddress),
            };
        }
        return metadata;
    }
}
