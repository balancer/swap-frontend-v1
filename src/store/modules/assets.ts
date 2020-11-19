import { ActionContext } from 'vuex';

import Ethereum from '@/api/ethereum';
import { RootState } from '@/store';
import config, { AssetMetadata } from '@/config';
import Storage from '@/utils/storage';

export interface AssetState {
    metadata: Record<string, AssetMetadata>;
}

const mutations = {
    addMetadata: (_state: AssetState, metadata: Record<string, AssetMetadata>): void => {
        for (const address in metadata) {
            _state.metadata[address] = metadata[address];
        }
    },
};

const actions = {
    init: async({ commit }: ActionContext<AssetState, RootState>): Promise<void> => {
        commit('addMetadata', config.assets);
        commit('addMetadata', Storage.getAssets(config.chainId));
    },
    fetch: async({ commit }: ActionContext<AssetState, RootState>, assets: string[]): Promise<void> => {
        const metadata = await Ethereum.fetchAssetMetadata(assets);
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
