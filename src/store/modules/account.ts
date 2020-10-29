import { WebSocketProvider, Web3Provider, Provider } from '@ethersproject/providers';

import Ethereum, { Allowances, Balances } from '@/api/ethereum';
import lock from '@/utils/connectors';
import { RootState } from '@/store';
import config from '@/config';
import { ActionContext } from 'vuex';


const LS_CONNECTOR_KEY = 'connector';

enum TransactionStatus {
    PENDING,
    OK,
    FAILED,
}

export interface AccountState {
    web3Provider: boolean;
    address: string;
    chainId: number;
    proxy: string;
    balances: Balances;
    allowances: Allowances;
    transactions: Transaction[];
}

interface Transaction {
    text: string;
    hash: string;
    status: TransactionStatus;
}

interface TransactionData {
    text: string;
    transaction: {
        hash: string;
    }
}

const mutations = {
    setWeb3Provider: (_state: AccountState, hasProvider: boolean): void => {
        _state.web3Provider = hasProvider;
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
        });
    },
    addTransactionReceipt: (_state: AccountState, transactionReceipt: any): void => {
        const hash = transactionReceipt.transactionHash;
        const status = transactionReceipt.status === 1
            ? TransactionStatus.OK
            : TransactionStatus.FAILED;
        const transactionIndex = _state.transactions
            .findIndex(transaction => transaction.hash === hash);
        _state.transactions[transactionIndex].status = status;
    },
    clean: (_state: AccountState): void => {
        _state.proxy = '';
        _state.balances = {};
        _state.allowances = {};
        _state.transactions = [];
    },
};

const actions = {
    init: async({ dispatch }: ActionContext<AccountState, RootState>): Promise<void> => {
        // Save Web3 provider if available
        const connectorKey = localStorage.getItem(LS_CONNECTOR_KEY);
        if (connectorKey) {
            const connector = lock.getConnector(connectorKey);
            const provider = await connector.connect();
            dispatch('saveWeb3Provider', provider);
        }
    },
    connect: async({ dispatch }: ActionContext<AccountState, RootState>, connectorKey: string): Promise<void> => {
        const connector = lock.getConnector(connectorKey);
        const provider = await connector.connect();
        if (provider) {
            localStorage.setItem(LS_CONNECTOR_KEY, connectorKey);
            dispatch('saveWeb3Provider', provider);
        }
    },
    disconnect: async({ commit }: ActionContext<AccountState, RootState>): Promise<void> => {
        const connectorKey = localStorage.getItem(LS_CONNECTOR_KEY);
        if (connectorKey) {
            const connector = lock.getConnector(connectorKey);
            const isLoggedIn = connector.isLoggedIn();
            if (isLoggedIn) {
                await connector.logout();
            }
            localStorage.removeItem(LS_CONNECTOR_KEY);
        }
        commit('setWeb3Provider', false);
        commit('setAddress', '');
        commit('setChainId', 0);
    },
    saveWeb3Provider: async({ commit, dispatch }: ActionContext<AccountState, RootState>, provider: any): Promise<void> => {
        if (provider.removeAllListeners) {
            provider.removeAllListeners();
        }
        if (provider && provider.on) {
            provider.on('chainChanged', async () => {
                dispatch('clean');
                dispatch('saveWeb3Provider', provider);
            });
            provider.on('accountsChanged', async () => {
                dispatch('clean');
                dispatch('saveWeb3Provider', provider);
            });
            provider.on('disconnect', async () => {
                dispatch('disconnect');
            });
        }
        const web3Provider = new Web3Provider(provider);
        const network = await web3Provider.getNetwork();
        const accounts = await web3Provider.listAccounts();
        commit('setWeb3Provider', true);
        commit('setAddress', accounts[0]);
        commit('setChainId', network.chainId);
        dispatch('fetchState');
    },
    clean: async({ commit }: ActionContext<AccountState, RootState>): Promise<void> => {
        commit('clean');
    },
    fetchState: async({ commit, state, getters, rootState }: ActionContext<AccountState, RootState>): Promise<void> => {
        const provider = await getters.readProvider;
        const { address } = state;
        const { metadata } = rootState.assets;
        const assets = Object.keys(metadata);
        const { proxy, balances, allowances } = await Ethereum.fetchAccountState(provider, address, assets);
        commit('setProxy', proxy);
        commit('addBalances', balances);
        commit('addAllowances', allowances);
    },
    fetchAssets: async({ commit, state, getters }: ActionContext<AccountState, RootState>, assets: string[]): Promise<void> => {
        const provider = await getters.readProvider;
        const { address } = state;
        const { balances, allowances } = await Ethereum.fetchAccountState(provider, address, assets);
        commit('addBalances', balances);
        commit('addAllowances', allowances);
    },
    saveTransaction: async({ commit }: ActionContext<AccountState, RootState>, transactionData: TransactionData): Promise<void> => {
        commit('addTransaction', transactionData);
    },
    saveTransactionReceipt: async({ commit }: ActionContext<AccountState, RootState>, transactionReceipt: any): Promise<void> => {
        commit('addTransactionReceipt', transactionReceipt);
    },
};

const getters = {
    provider: async(state: AccountState): Promise<Provider> => {
        if (state.web3Provider) {
            const connectorKey = localStorage.getItem(LS_CONNECTOR_KEY) || 'injected';
            const connector = lock.getConnector(connectorKey);
            const provider = await connector.connect();
            return new Web3Provider(provider);
        }
        const fallbackProvider = new WebSocketProvider(config.alchemyWsUrl);
        return fallbackProvider;
    },
    readProvider: (): Provider => {
        return new WebSocketProvider(config.alchemyWsUrl);
    },
};

function state(): AccountState {
    return {
        web3Provider: false,
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
