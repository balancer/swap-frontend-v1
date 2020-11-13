import { TokenMetadata } from '@/config';
import { Transaction } from '@/store/modules/account';

const CONNECTOR = 'connector';
const PREFERENCES = 'preferences';
const INPUT_ASSET = 'input_asset';
const OUTPUT_ASSET = 'output_asset';
const TRANSACTIONS = 'transactions';
const ASSETS = 'assets';

type Transactions = Record<string, Record<number, Record<string, Transaction>>>;
type Assets = Record<number, Record<string, TokenMetadata>>;

interface Preferences {
    slippage: number;
}

export default class Storage {
    static getConnector(): string | null {
        const connector = localStorage.getItem(CONNECTOR);
        return connector;
    }

    static getSlippage(): number {
        const preferences = getPreferences();
        return preferences.slippage;
    }

    static getInputAsset(): string | null {
        const asset = localStorage.getItem(INPUT_ASSET);
        return asset;
    }

    static getOutputAsset(): string | null {
        const asset = localStorage.getItem(OUTPUT_ASSET);
        return asset;
    }

    static getTransactions(account: string, chainId: number): Record<string, Transaction> {
        const transactionString = localStorage.getItem(TRANSACTIONS);
        const transactions: Transactions = transactionString
            ? JSON.parse(transactionString)
            : {};
        if (!transactions ||
            !transactions[account] ||
            !transactions[account][chainId]
        ) {
            return {};
        }
        return transactions[account][chainId];
    }

    static getAssets(chainId: number): Record<string, TokenMetadata> {
        const assetString = localStorage.getItem(ASSETS);
        const assets: Assets = assetString
            ? JSON.parse(assetString)
            : {};
        if (!assets[chainId]) {
            return {};
        }
        return assets[chainId];
    }

    static saveConnector(connector: string): void {
        localStorage.setItem(CONNECTOR, connector);
    }

    static saveSlippage(slippage: number): void {
        const preferences = getPreferences();
        preferences.slippage = slippage;
        localStorage.setItem(PREFERENCES, JSON.stringify(preferences));
    }

    static saveInputAsset(asset: string): void {
        localStorage.setItem(INPUT_ASSET, asset);
    }

    static saveOutputAsset(asset: string): void {
        localStorage.setItem(OUTPUT_ASSET, asset);
    }

    static saveTransaction(account: string, chainId: number, transaction: Transaction): void {
        const transactionString = localStorage.getItem(TRANSACTIONS);
        const transactions: Transactions = transactionString
            ? JSON.parse(transactionString)
            : {};
        if (!transactions[account]) {
            transactions[account] = {};
        }
        if (!transactions[account][chainId]) {
            transactions[account][chainId] = {};
        }
        transactions[account][chainId][transaction.hash] = transaction;
        localStorage.setItem(TRANSACTIONS, JSON.stringify(transactions));
    }

    static saveAssets(chainId: number, assets: Record<string, TokenMetadata>): void {
        const assetString = localStorage.getItem(ASSETS);
        const assetList: Assets = assetString
            ? JSON.parse(assetString)
            : {};
        if (!assetList[chainId]) {
            assetList[chainId] = {};
        }
        for (const address in assets) {
            assetList[chainId][address] = assets[address];
        }
        localStorage.setItem(ASSETS, JSON.stringify(assetList));
    }

    static clearConnector(): void {
        localStorage.removeItem(CONNECTOR);
    }

    static clearTransactions(): void {
        localStorage.removeItem(TRANSACTIONS);
    }
}

function getPreferences(): Preferences {
    const defaultPreferences: Preferences = {
        slippage: 0.005,
    };
    const preferenceString = localStorage.getItem(PREFERENCES);
    if (!preferenceString) {
        return defaultPreferences;
    }
    const preferences = JSON.parse(preferenceString);
    return preferences;
}
