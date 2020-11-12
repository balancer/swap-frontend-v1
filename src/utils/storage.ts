import { Transaction } from '@/store/modules/account';

const CONNECTOR = 'connector';
const INPUT_ASSET = 'input_asset';
const OUTPUT_ASSET = 'output_asset';
const TRANSACTIONS = 'transactions';

export default class Storage {
    static getConnector(): string | null {
        const connector = localStorage.getItem(CONNECTOR);
        return connector;
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
        const transactions = transactionString
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

    static saveConnector(connector: string): void {
        localStorage.setItem(CONNECTOR, connector);
    }

    static saveInputAsset(asset: string): void {
        localStorage.setItem(INPUT_ASSET, asset);
    }

    static saveOutputAsset(asset: string): void {
        localStorage.setItem(OUTPUT_ASSET, asset);
    }

    static saveTransaction(account: string, chainId: number, transaction: Transaction): void {
        const transactionString = localStorage.getItem(TRANSACTIONS);
        const transactions = transactionString
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

    static clearConnector(): void {
        localStorage.removeItem(CONNECTOR);
    }

    static clearTransactions(): void {
        localStorage.removeItem(TRANSACTIONS);
    }
}
