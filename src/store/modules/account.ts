import { ActionContext } from 'vuex';
import { Web3Provider, Provider } from '@ethersproject/providers';

import Ethereum, { Allowances, Balances } from '@/api/ethereum';
import { RootState } from '@/store';
import lock, { getConnectorName, getConnectorLogo } from '@/utils/connectors';
import provider from '@/utils/provider';
import Storage from '@/utils/storage';

enum TransactionStatus {
    PENDING,
    OK,
    FAILED,
}

export interface AccountState {
    connector: Connector | null;
    address: string;
    chainId: number;
    proxy: string;
    balances: Balances;
    allowances: Allowances;
    transactions: Record<string, Transaction>;
}

export interface Transaction {
    text: string;
    hash: string;
    status: TransactionStatus;
    timestamp: number;
}

interface Connector {
    id: string;
    name: string;
}

interface TransactionData {
    text: string;
    transaction: {
        hash: string;
    };
}

interface MinedTransaction {
    receipt: any;
    timestamp: number;
}

const mutations = {
    setConnector: (_state: AccountState, connector: Connector | null): void => {
        _state.connector = connector;
    },
    setAddress: (_state: AccountState, address: string): void => {
        _state.address = address;
    },
    setChainId: (_state: AccountState, chainId: number): void => {
        _state.chainId = chainId;
    },
    setProxy: (_state: AccountState, proxy: string): void => {
        _state.proxy = proxy;
    },
    addBalances: (_state: AccountState, balances: Balances): void => {
        for (const address in balances) {
            _state.balances[address] = balances[address];
        }
    },
    addAllowances: (_state: AccountState, allowances: Allowances): void => {
        for (const spender in allowances) {
            if (!_state.allowances[spender]) {
                _state.allowances[spender] = {};
            }
            for (const asset in allowances[spender]) {
                const allowance = allowances[spender][asset];
                _state.allowances[spender][asset] = allowance;
            }
        }
    },
    setTransactions: (_state: AccountState, transactions: Record<string, Transaction>): void => {
        _state.transactions = transactions;
    },
    setTransaction: (_state: AccountState, transaction: Transaction): void => {
        _state.transactions[transaction.hash] = transaction;
    },
    clearTransactions: (_state: AccountState): void => {
        _state.transactions = {};
    },
    clear: (_state: AccountState): void => {
        _state.proxy = '';
        _state.balances = {};
        _state.allowances = {};
        _state.transactions = {};
    },
};

const actions = {
    init: async({ dispatch }: ActionContext<AccountState, RootState>): Promise<void> => {
        // Save Web3 provider if available
        const connectorId = Storage.getConnector();
        dispatch('connect', connectorId);
    },
    connect: async({ commit, dispatch }: ActionContext<AccountState, RootState>, connectorId: string): Promise<void> => {
        if (!connectorId) {
            return;
        }
        const connector = lock.getConnector(connectorId);
        if (!connector) {
            return;
        }
        commit('setConnector', {
            id: connectorId,
            name: getConnectorName(connectorId),
            logo: getConnectorLogo(connectorId),
        });
        const provider = await connector.connect();
        if (!provider) {
            dispatch('disconnect');
            return;
        }
        const web3Provider = new Web3Provider(provider);
        const accounts = await web3Provider.listAccounts();
        if (accounts.length === 0) {
            dispatch('disconnect');
            return;
        }
        dispatch('saveProvider', provider);
        Storage.saveConnector(connectorId);
    },
    disconnect: async({ commit }: ActionContext<AccountState, RootState>): Promise<void> => {
        const connectorId = Storage.getConnector();
        if (connectorId) {
            const connector = lock.getConnector(connectorId);
            const isLoggedIn = connector.isLoggedIn();
            if (isLoggedIn) {
                await connector.logout();
            }
            Storage.clearConnector();
        }
        commit('setConnector', null);
        commit('setAddress', '');
        commit('setChainId', 0);
        commit('clear');
    },
    saveProvider: async({ commit, dispatch }: ActionContext<AccountState, RootState>, provider: any): Promise<void> => {
        if (provider.removeAllListeners) {
            provider.removeAllListeners();
        }
        if (provider && provider.on) {
            provider.on('chainChanged', async () => {
                commit('clear');
                dispatch('saveProvider', provider);
            });
            provider.on('accountsChanged', async () => {
                commit('clear');
                dispatch('saveProvider', provider);
            });
            provider.on('disconnect', async () => {
                dispatch('disconnect');
            });
        }
        const web3Provider = new Web3Provider(provider);
        const network = await web3Provider.getNetwork();
        const accounts = await web3Provider.listAccounts();
        const account = accounts[0];
        const transactions = Storage.getTransactions(account, network.chainId);
        commit('setAddress', account);
        commit('setChainId', network.chainId);
        commit('setTransactions', transactions);
        dispatch('fetchState');
    },
    fetchState: async({ commit, state, rootGetters }: ActionContext<AccountState, RootState>): Promise<void> => {
        const { address } = state;
        const metadata = rootGetters['assets/metadata'];
        const assets = Object.keys(metadata);
        console.time(`[API] fetchAccountState: ${address}`);
        const { proxy, balances, allowances } = await Ethereum.fetchAccountState(address, assets);
        console.timeEnd(`[API] fetchAccountState: ${address}`);
        commit('setProxy', proxy);
        commit('addBalances', balances);
        commit('addAllowances', allowances);
    },
    fetchAssets: async({ commit, state }: ActionContext<AccountState, RootState>, assets: string[]): Promise<void> => {
        const { address } = state;
        if (!address) {
            return;
        }
        console.time(`[API] fetchAccountState: ${address}`);
        const { balances, allowances } = await Ethereum.fetchAccountState(address, assets);
        console.timeEnd(`[API] fetchAccountState: ${address}`);
        commit('addBalances', balances);
        commit('addAllowances', allowances);
    },
    clearTransactions: async({ commit }: ActionContext<AccountState, RootState>): Promise<void> => {
        commit('clearTransactions');
    },
    saveTransaction: async({ commit }: ActionContext<AccountState, RootState>, transactionData: TransactionData): Promise<void> => {
        const { text } = transactionData;
        const { hash } = transactionData.transaction;
        const transaction = {
            text,
            hash,
            status: TransactionStatus.PENDING,
            timestamp: 0,
        };
        commit('setTransaction', transaction);
    },
    saveMinedTransaction: async({ state, commit }: ActionContext<AccountState, RootState>, transaction: MinedTransaction): Promise<void> => {
        const { receipt, timestamp } = transaction;
        const hash = receipt.transactionHash;
        const status = receipt.status === 1
            ? TransactionStatus.OK
            : TransactionStatus.FAILED;
        const oldTransaction = state.transactions[hash];
        const updatedTransaction = {
            text: oldTransaction.text,
            hash,
            status,
            timestamp,
        };
        commit('setTransaction', updatedTransaction);
        Storage.saveTransaction(state.address, state.chainId, updatedTransaction);
    },
};

const getters = {
    provider: async(state: AccountState): Promise<Provider> => {
        if (state.connector && state.connector.id) {
            const connector = lock.getConnector(state.connector.id);
            const provider = await connector.connect();
            return new Web3Provider(provider);
        }
        return provider;
    },
};

function state(): AccountState {
    return {
        connector: null,
        address: '',
        chainId: 0,
        proxy: '',
        balances: {},
        allowances: {},
        transactions: {},
    };
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
