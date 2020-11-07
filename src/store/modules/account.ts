import { ActionContext } from 'vuex';
import { Web3Provider, Provider } from '@ethersproject/providers';

import Ethereum, { Allowances, Balances } from '@/api/ethereum';
import { RootState } from '@/store';
import lock, { getConnectorName, getConnectorLogo } from '@/utils/connectors';
import wsProvider from '@/utils/provider';

const LS_CONNECTOR_ID = 'connector';

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
    transactions: Transaction[];
}

interface Connector {
    id: string;
    name: string;
}

interface Transaction {
    text: string;
    hash: string;
    status: TransactionStatus;
    timestamp: number;
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
    addTransaction: (_state: AccountState, transactionData: TransactionData): void => {
        const { transaction, text } = transactionData;
        _state.transactions.push({
            text,
            hash: transaction.hash,
            status: TransactionStatus.PENDING,
            timestamp: 0,
        });
    },
    addMinedTransaction: (_state: AccountState, transaction: MinedTransaction): void => {
        const { receipt, timestamp } = transaction;
        const hash = receipt.transactionHash;
        const status = receipt.status === 1
            ? TransactionStatus.OK
            : TransactionStatus.FAILED;
        const transactionIndex = _state.transactions
            .findIndex(transaction => transaction.hash === hash);
        _state.transactions[transactionIndex].status = status;
        _state.transactions[transactionIndex].timestamp = timestamp;
    },
    clearTransactions: (_state: AccountState): void => {
        _state.transactions = [];
    },
    clear: (_state: AccountState): void => {
        _state.proxy = '';
        _state.balances = {};
        _state.allowances = {};
        _state.transactions = [];
    },
};

const actions = {
    init: async({ dispatch }: ActionContext<AccountState, RootState>): Promise<void> => {
        // Save Web3 provider if available
        const connectorId = localStorage.getItem(LS_CONNECTOR_ID);
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
            return;
        }
        dispatch('saveProvider', provider);
        localStorage.setItem(LS_CONNECTOR_ID, connectorId);
    },
    disconnect: async({ commit }: ActionContext<AccountState, RootState>): Promise<void> => {
        const connectorId = localStorage.getItem(LS_CONNECTOR_ID);
        if (connectorId) {
            const connector = lock.getConnector(connectorId);
            const isLoggedIn = connector.isLoggedIn();
            if (isLoggedIn) {
                await connector.logout();
            }
            localStorage.removeItem(LS_CONNECTOR_ID);
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
        commit('setAddress', accounts[0]);
        commit('setChainId', network.chainId);
        dispatch('fetchState');
    },
    fetchState: async({ commit, state, rootState }: ActionContext<AccountState, RootState>): Promise<void> => {
        const { address } = state;
        const { metadata } = rootState.assets;
        const assets = Object.keys(metadata);
        const { proxy, balances, allowances } = await Ethereum.fetchAccountState(address, assets);
        commit('setProxy', proxy);
        commit('addBalances', balances);
        commit('addAllowances', allowances);
    },
    fetchAssets: async({ commit, state }: ActionContext<AccountState, RootState>, assets: string[]): Promise<void> => {
        const { address } = state;
        const { balances, allowances } = await Ethereum.fetchAccountState(address, assets);
        commit('addBalances', balances);
        commit('addAllowances', allowances);
    },
    clearTransactions: async({ commit }: ActionContext<AccountState, RootState>): Promise<void> => {
        commit('clearTransactions');
    },
    saveTransaction: async({ commit }: ActionContext<AccountState, RootState>, transactionData: TransactionData): Promise<void> => {
        commit('addTransaction', transactionData);
    },
    saveMinedTransaction: async({ commit }: ActionContext<AccountState, RootState>, transaction: MinedTransaction): Promise<void> => {
        commit('addMinedTransaction', transaction);
    },
};

const getters = {
    provider: async(state: AccountState): Promise<Provider> => {
        if (state.connector && state.connector.id) {
            const connector = lock.getConnector(state.connector.id);
            const provider = await connector.connect();
            return new Web3Provider(provider);
        }
        return wsProvider;
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
        transactions: [],
    };
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
