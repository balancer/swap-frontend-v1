import { ethers } from 'ethers';

import lock from '../../utils/connectors';
import config from '../../config/index';

const mutations = {
    setWeb3Provider: (_state: any, provider: any): void => {
        _state.provider.web3 = provider;
    },
    setFallbackProvider: (_state: any, provider: any): void => {
        _state.provider.fallback = provider;
    },
    setAddress: (_state: any, address: string): void => {
        _state.address = address;
    },
    setChainId: (_state: any, chainId: number): void => {
        _state.chainId = chainId;
    },
};

const actions = {
    init: async({ commit }: any): Promise<void> => {
        // Save Alchemy provider as fallback
        const fallbackProvider = new ethers.providers.JsonRpcProvider(config.alchemyUrl);
        commit('setFallbackProvider', fallbackProvider);
    },
    connect: async({ commit }: any, connectorKey: any): Promise<void> => {
        const connector = lock.getConnector(connectorKey);
        const provider = await connector.connect();
        const web3Provider = new ethers.providers.Web3Provider(provider);
        const network = await web3Provider.getNetwork();
        const accounts = await web3Provider.listAccounts();
        commit('setWeb3Provider', web3Provider);
        commit('setAddress', accounts[0]);
        commit('setChainId', network.chainId);
    },
    disconnect: async({ commit }: any): Promise<void> => {
        commit('setWeb3Provider', null);
        commit('setAddress', '');
    },
};

function state(): any {
    return {
        provider: {
            web3: null,
            fallback: null,
        },
        address: '',
        chainId: 0,
    };
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
};
