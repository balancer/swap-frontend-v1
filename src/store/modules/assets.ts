import { ActionContext } from 'vuex';

import Ethereum from '@/api/ethereum';
import { RootState } from '@/store';
import config, { AssetMetadata } from '@/config';
import { TokenList, DEFAULT_LIST, listMetadata, getTokenlist, getAssetsFromTokenlist } from '@/utils/list';
import Storage from '@/utils/storage';

type Metadata = Record<string, AssetMetadata>;

export interface AssetState {
    listId: string;
    lists: Record<string, TokenList>;
    custom: Metadata;
}

interface AddListPayload {
    listId: string;
    list: TokenList;
}

const mutations = {
    selectList: (_state: AssetState, listId: string): void => {
        _state.listId = listId;
    },
    addList: (_state: AssetState, payload: AddListPayload): void => {
        _state.lists[payload.listId] = payload.list;
    },
    addCustomMetadata: (_state: AssetState, custom: Record<string, AssetMetadata>): void => {
        for (const address in custom) {
            _state.custom[address] = custom[address];
        }
    },
};

const actions = {
    init: async({ commit }: ActionContext<AssetState, RootState>): Promise<void> => {
        const listId = Storage.getList();
        const list = await getTokenlist(listId);
        commit('addList', { listId, list });
    },
    fetchLists: async({ commit }: ActionContext<AssetState, RootState>): Promise<void> => {
        const listIds = Object.keys(listMetadata);
        const lists = await Promise.all(listIds.map(listId => getTokenlist(listId)));
        for (const index in lists) {
            commit('addList', {
                listId: listIds[index],
                list: lists[index],
            });
        }
    },
    fetchMetadata: async({ commit }: ActionContext<AssetState, RootState>, assets: string[]): Promise<void> => {
        console.time(`[API] fetchAssetMetadata: N=${assets.length}`);
        const metadata = await Ethereum.fetchAssetMetadata(assets);
        console.timeEnd(`[API] fetchAssetMetadata: N=${assets.length}`);
        Storage.saveAssets(config.chainId, metadata);
        commit('addCustomMetadata', metadata);
    },
};

const getters = {
    metadata: (state: AssetState): Metadata => {
        const list = state.lists[state.listId];
        const listAssets = getAssetsFromTokenlist(config.chainId, list);
        const metadata = {
            ...listAssets,
            ...state.custom,
        };
        return metadata;
    },
};

function state(): AssetState {
    return {
        listId: DEFAULT_LIST,
        lists: {},
        custom: {},
    };
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
