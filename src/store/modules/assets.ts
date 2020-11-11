import Coingecko from '@/api/coingecko';
import Ethereum from '@/api/ethereum';
import { RootState } from '@/store';
import config, { TokenMetadata } from '@/config';
import { ActionContext } from 'vuex';

export interface AssetState {
    metadata: Record<string, TokenMetadata>;
    price: Record<string, number>;
}

const mutations = {
    addMetadata: (_state: AssetState, metadata: Record<string, TokenMetadata>): void => {
        for (const address in metadata) {
            _state.metadata[address] = metadata[address];
        }
    },
    addPrice: (_state: AssetState, price: Record<string, number>): void => {
        for (const address in price) {
            _state.price[address] = price[address];
        }
    },
};

const actions = {
    init: async({ commit, dispatch }: ActionContext<AssetState, RootState>): Promise<void> => {
        const metadata = config.tokens;
        commit('addMetadata', metadata);
        const assets = Object.keys(config.tokens);
        dispatch('fetchPrices', assets);
    },
    fetch: async({ dispatch }: ActionContext<AssetState, RootState>, assets: string[]): Promise<void> => {
        dispatch('fetchMetadata', assets);
        dispatch('fetchPrices', assets);        
    },
    fetchMetadata: async({ commit }: ActionContext<AssetState, RootState>, assets: string[]): Promise<void> => {
        const metadata = await Ethereum.fetchTokenMetadata(assets);
        commit('addMetadata', metadata);
    },
    fetchPrices: async({ commit }: ActionContext<AssetState, RootState>, assets: string[]): Promise<void> => {
        const price = await Coingecko.fetchPrice(assets);
        commit('addPrice', price);
    },
};

function state(): AssetState {
    return {
        metadata: {},
        price: {},
    };
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
};
