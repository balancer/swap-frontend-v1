import Ethereum, { TokenMetadata } from '@/api/ethereum';
import { RootState } from '@/store';
import config from '@/config';
import { ActionContext } from 'vuex';

export interface AssetState {
    metadata: Record<string, TokenMetadata>;
}

const mutations = {
    addMetadata: (_state: AssetState, metadata: Record<string, TokenMetadata>): void => {
        for (const assetsAddress in metadata) {
            _state.metadata[assetsAddress] = metadata[assetsAddress];
        }
    },
};

const actions = {
    init: ({ commit }: ActionContext<AssetState, RootState>): void => {
        const metadata = config.tokens;
        commit('addMetadata', metadata);
    },
    fetch: async({ commit, rootGetters }: ActionContext<AssetState, RootState>, assets: string[]): Promise<void> => {
        const provider = await rootGetters['account/provider'];
        const metadata = await Ethereum.fetchTokenMetadata(provider, assets);
        commit('addMetadata', metadata);
    },
};

function state(): AssetState {
    return {
        metadata: {},
    };
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
};
