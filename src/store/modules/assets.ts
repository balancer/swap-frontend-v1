import { ActionContext } from 'vuex';

import Ethereum from '@/api/ethereum';
import { RootState } from '@/store';
import config, { AssetMetadata } from '@/config';
import { getAssetsFromTokenlist } from '@/utils/list';
import Storage from '@/utils/storage';

export interface AssetState {
    metadata: Record<string, AssetMetadata>;
}

const mutations = {
    clearMetadata: (_state: AssetState): void => {
        _state.metadata = {};
    },
    addMetadata: (_state: AssetState, metadata: Record<string, AssetMetadata>): void => {
        for (const address in metadata) {
            _state.metadata[address] = metadata[address];
        }
    },
};

const actions = {
    init: async({ dispatch }: ActionContext<AssetState, RootState>): Promise<void> => {
        const list = Storage.getList();
        dispatch('setList', list);
    },
    setList: async({ commit }: ActionContext<AssetState, RootState>, listId: string): Promise<void> => {
        const list = await getAssetsFromTokenlist(config.chainId, listId);
        commit('clearMetadata');
        commit('addMetadata', list);
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
