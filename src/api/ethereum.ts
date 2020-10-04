// @ts-ignore
import ethcall from 'ethcall';

import dsProxyRegistryAbi from '../abi/DSProxyRegistry.json';
import erc20Abi from '../abi/ERC20.json';

import config from '../config';
import { ETH_KEY } from '../utils/tokens';

export default class Ethereum {
    static async fetchAccountState(provider: any, address: string, tokens: string[]): Promise<any> {
        const ethcallProvider = new ethcall.Provider();
        await ethcallProvider.init(provider);
        const calls = [];
        // Fetch balances and allowances
        const exchangeProxyAddress = config.addresses.exchangeProxy;
        for (const tokenAddress of tokens) {
            if (tokenAddress === ETH_KEY) {
                continue;
            }
            const tokenContract = new ethcall.Contract(tokenAddress, erc20Abi);
            const balanceCall = tokenContract.balanceOf(address);
            const allowanceCall = tokenContract.allowance(address, exchangeProxyAddress);
            calls.push(balanceCall);
            calls.push(allowanceCall);
        }
        // Fetch ether balance
        const ethBalanceCall = ethcallProvider.getEthBalance(address);
        calls.push(ethBalanceCall);
        // Fetch proxy
        const dsProxyRegistryAddress = config.addresses.dsProxyRegistry;
        const dsProxyRegistryContract = new ethcall.Contract(
            dsProxyRegistryAddress,
            dsProxyRegistryAbi,
        );
        const proxyCall = dsProxyRegistryContract.proxies(address);
        calls.push(proxyCall);
        // Fetch data
        const data = await ethcallProvider.all(calls);
        const tokenCount = tokens.length - 1; // skip ether
        const allowances = {};
        allowances[exchangeProxyAddress] = {};
        const balances: Record<string, string> = {};
        let i = 0;
        for (const tokenAddress of tokens) {
            if (tokenAddress === ETH_KEY) {
                continue;
            }
            balances[tokenAddress] = data[2 * i].toString();
            allowances[exchangeProxyAddress][tokenAddress] = data[2 * i + 1].toString();
            i++;
        }
        balances.ether = data[2 * tokenCount].toString();
        const proxy = data[2 * tokenCount + 1];
        return { allowances, balances, proxy };
    }

    static async fetchTokenMetadata(provider: any, tokens: string[]): Promise<any> {
        const ethcallProvider = new ethcall.Provider();
        await ethcallProvider.init(provider);
        const calls = [];
        // Fetch token metadata
        for (const tokenAddress of tokens) {
            const tokenContract = new ethcall.Contract(tokenAddress, erc20Abi);
            const nameCall = tokenContract.name();
            const symbolCall = tokenContract.symbol();
            const decimalCall = tokenContract.decimals();
            calls.push(nameCall);
            calls.push(symbolCall);
            calls.push(decimalCall);
        }
        // Fetch data
        const data = await ethcallProvider.all(calls);
        const metadata = {};
        for (let i = 0; i < tokens.length; i++) {
            const tokenAddress = tokens[i];
            const name = data[3 * i];
            const symbol = data[3 * i + 1];
            const decimals = data[3 * i + 2];
            metadata[tokenAddress] = {
                name,
                symbol,
                decimals,
            };
        }
        return metadata;
    }
}
