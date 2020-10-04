import { ethers } from 'ethers';

import Ethereum from '../../api/ethereum';
import lock from '../../utils/connectors';
import config from '../../config';

const LS_CONNECTOR_KEY = '_lock.connector';

const mutations = {
    setWeb3Provider: (_state: any, provider: any): void => {
        _state.web3Provider = provider;
    },
    setFallbackProvider: (_state: any, provider: any): void => {
        _state.fallbackProvider = provider;
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
            for (const token in allowances[spender]) {
                const allowance = allowances[spender][token];
                _state.allowances[spender][token] = allowance;
            }
        }
    },
    clean: (_state: any): void => {
        _state.proxy = '';
        _state.balances = {};
        _state.allowances = {};
    },
};

const actions = {
    init: async({ commit, dispatch }: any): Promise<void> => {
        // Save Alchemy provider as fallback
        const fallbackProvider = new ethers.providers.JsonRpcProvider(config.alchemyUrl);
        commit('setFallbackProvider', fallbackProvider);
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
        commit('setWeb3Provider', null);
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
        const web3Provider = new ethers.providers.Web3Provider(provider);
        const network = await web3Provider.getNetwork();
        const accounts = await web3Provider.listAccounts();
        commit('setWeb3Provider', web3Provider);
        commit('setAddress', accounts[0]);
        commit('setChainId', network.chainId);
        dispatch('fetchState');
    },
    clean: async({ commit }: any): Promise<void> => {
        commit('setProxy', '');
        commit('addBalances', {});
        commit('addAllowances', {});
    },
    fetchState: async({ commit, state, rootState }: any): Promise<void> => {
        const { web3Provider, address } = state;
        const { metadata } = rootState.tokens;
        const tokens = Object.keys(metadata);
        const { proxy, balances, allowances } = await Ethereum.fetchAccountState(web3Provider, address, tokens);
        commit('setProxy', proxy);
        commit('addBalances', balances);
        commit('addAllowances', allowances);
    },
};

const getters = {
    provider: (state: any): any => {
        return state.fallbackProvider || state.web3Provider;
    },
};

function state(): any {
    return {
        web3Provider: null,
        fallbackProvider: null,
        address: '',
        chainId: 0,
        proxy: '',
        balances: {},
        allowances: {},
    };
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
