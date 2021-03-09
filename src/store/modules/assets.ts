import { ActionContext } from 'vuex';

import Ethereum from '@/api/ethereum';
import { RootState } from '@/store';
import config, { AssetMetadata } from '@/config';
import { TokenList,
    DEFAULT_LIST,
    listMetadata,
    getTokenlist,
    getAssetsFromTokenlist,
    ELIGIBILE_TOKEN_LIST,
    getAnyListData } from '@/utils/list';
import Storage from '@/utils/storage';

type Metadata = Record<string, AssetMetadata>;

export interface AssetState {
    listId: string;
    lists: Record<string, TokenList>;
    custom: Metadata;
    data: any;
}

interface AddListPayload {
    listId: string;
    list: TokenList;
}

interface AddDataPayload {
    id: string;
    data: any;
}

const mutations = {
    selectList: (_state: AssetState, listId: string): void => {
        _state.listId = listId;
    },
    addList: (_state: AssetState, payload: AddListPayload): void => {
        _state.lists[payload.listId] = payload.list;
    },
    addData: (_state: AssetState, payload: AddDataPayload): void => {
        _state.data[payload.id] = payload.data;
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
        const eligibleTokensList = await getAnyListData(ELIGIBILE_TOKEN_LIST);
        commit('addData', { id: ELIGIBILE_TOKEN_LIST, data: eligibleTokensList });
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
    eligibleTokensList: (state: AssetState): any => {
        return state.data[ELIGIBILE_TOKEN_LIST];
    },
};

function state(): AssetState {
    return {
        listId: DEFAULT_LIST,
        lists: {},
        custom: {},
        data: {},
    };
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
