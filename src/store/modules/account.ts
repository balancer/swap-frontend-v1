import { ethers } from 'ethers';

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
    saveWeb3Provider: async({ commit }: any, provider: any): Promise<void> => {
        const web3Provider = new ethers.providers.Web3Provider(provider);
        const network = await web3Provider.getNetwork();
        const accounts = await web3Provider.listAccounts();
        commit('setWeb3Provider', web3Provider);
        commit('setAddress', accounts[0]);
        commit('setChainId', network.chainId);
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
    };
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
