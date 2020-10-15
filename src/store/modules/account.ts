import { MaxUint256 } from '@ethersproject/constants';
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers';

import Ethereum from '@/api/ethereum';
import lock from '@/utils/connectors';
import config from '@/config';

const LS_CONNECTOR_KEY = 'connector';

enum TransactionStatus {
    PENDING,
    OK,
    FAILED,
}

const mutations = {
    setWeb3Provider: (_state: any, hasProvider: boolean): void => {
        _state.web3Provider = hasProvider;
    },
    setAddress: (_state: any, address: string): void => {
        _state.address = address;
    },
    setChainId: (_state: any, chainId: number): void => {
        _state.chainId = chainId;
    },
    setProxy: (_state: any, proxy: string): void => {
        _state.proxy = proxy;
    },
    addBalances: (_state: any, balances: any): void => {
        for (const address in balances) {
            _state.balances[address] = balances[address];
        }
    },
    addAllowances: (_state: any, allowances: any): void => {
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
    addTransaction: (_state: any, transaction: any): void => {
        const { hash } = transaction;
        _state.transactions.push({
            hash,
            status: TransactionStatus.PENDING,
        });
    },
    setTransaction: (_state: any, minedTransaction: any): void => {
        const hash = minedTransaction.transactionHash;
        const status = minedTransaction.status === 1
            ? TransactionStatus.OK
            : TransactionStatus.FAILED;
        const transactionIndex = _state.transactions
            .findIndex((transaction: any) => transaction.hash === hash);
        _state.transactions[transactionIndex] = {
            hash,
            status,
        };
    },
    clean: (_state: any): void => {
        _state.proxy = '';
        _state.balances = {};
        _state.allowances = {};
        _state.transactions = [];
    },
};

const actions = {
    init: async({ dispatch }: any): Promise<void> => {
        // Save Web3 provider if available
        const connectorKey = localStorage.getItem(LS_CONNECTOR_KEY);
        if (connectorKey) {
            const connector = lock.getConnector(connectorKey);
            const provider = await connector.connect();
            dispatch('saveWeb3Provider', provider);
        }
    },
    connect: async({ dispatch }: any, connectorKey: string): Promise<void> => {
        const connector = lock.getConnector(connectorKey);
        const provider = await connector.connect();
        if (provider) {
            localStorage.setItem(LS_CONNECTOR_KEY, connectorKey);
            dispatch('saveWeb3Provider', provider);
        }
    },
    disconnect: async({ commit }: any): Promise<void> => {
        const connectorKey = localStorage.getItem(LS_CONNECTOR_KEY);
        if (connectorKey) {
            const connector = lock.getConnector(connectorKey);
            const isLoggedIn = await connector.isLoggedIn();
            if (isLoggedIn) {
                await connector.logout();
            }
            localStorage.removeItem(LS_CONNECTOR_KEY);
        }
        commit('setWeb3Provider', false);
        commit('setAddress', '');
        commit('setChainId', 0);
    },
    saveWeb3Provider: async({ commit, dispatch }: any, provider: any): Promise<void> => {
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
    clean: async({ commit }: any): Promise<void> => {
        commit('clean');
    },
    fetchState: async({ commit, state, getters, rootState }: any): Promise<void> => {
        const provider = await getters.provider;
        const { address } = state;
        const { metadata } = rootState.assets;
        const assets = Object.keys(metadata);
        console.log('fetch state', getters.provider, provider);
        const { proxy, balances, allowances } = await Ethereum.fetchAccountState(provider, address, assets);
        commit('setProxy', proxy);
        commit('addBalances', balances);
        commit('addAllowances', allowances);
    },
    fetchAssets: async({ commit, state, getters }: any, assets: string[]): Promise<void> => {
        const provider = await getters.provider;
        const { address } = state;
        const { balances, allowances } = await Ethereum.fetchAccountState(provider, address, assets);
        commit('addBalances', balances);
        commit('addAllowances', allowances);
    },
    unlock: async({ commit }: any, { token, spender }: any): Promise<void> => {
        const allowances = {};
        allowances[spender] = {};
        allowances[spender][token] = MaxUint256;
        commit('addAllowances', allowances);
    },
    saveTransaction: async({ commit }: any, transaction: any): Promise<void> => {
        commit('addTransaction', transaction);
    },
    updateTransaction: async({ commit }: any, transaction: any): Promise<void> => {
        commit('setTransaction', transaction);
    },
};

const getters = {
    provider: async(state: any): Promise<any> => {
        if (state.web3Provider) {
            const connectorKey = localStorage.getItem(LS_CONNECTOR_KEY);
            const connector = lock.getConnector(connectorKey);
            const provider = await connector.connect();
            return new Web3Provider(provider);
        }
        const fallbackProvider = new JsonRpcProvider(config.alchemyUrl);
        return fallbackProvider;
    },
};

function state(): any {
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
