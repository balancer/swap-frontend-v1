import { ActionContext } from 'vuex';

import Ethereum from '@/api/ethereum';
import { RootState } from '@/store';
import config, { TokenMetadata } from '@/config';
import Storage from '@/utils/storage';

export interface AssetState {
    metadata: Record<string, TokenMetadata>;
}

const mutations = {
    addMetadata: (_state: AssetState, metadata: Record<string, TokenMetadata>): void => {
        for (const address in metadata) {
            _state.metadata[address] = metadata[address];
        }
    },
};

const actions = {
    init: async({ commit }: ActionContext<AssetState, RootState>): Promise<void> => {
        commit('addMetadata', config.tokens);
        commit('addMetadata', Storage.getAssets(config.chainId));
    },
    fetch: async({ commit }: ActionContext<AssetState, RootState>, assets: string[]): Promise<void> => {
        const metadata = await Ethereum.fetchTokenMetadata(assets);
        Storage.saveAssets(config.chainId, metadata);
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
