import Ethereum from '@/api/ethereum';
import config from '@/config';

const mutations = {
    addMetadata: (_state: any, metadata: any): void => {
        for (const assetsAddress in metadata) {
            _state.metadata[assetsAddress] = metadata[assetsAddress];
        }
    },
};

const actions = {
    init: ({ commit }: any): void => {
        const metadata = config.tokens;
        commit('addMetadata', metadata);
    },
    fetch: async({ commit, rootGetters }: any, assets: string[]): Promise<void> => {
        const provider = await rootGetters['account/provider'];
        const metadata = await Ethereum.fetchTokenMetadata(provider, assets);
        commit('addMetadata', metadata);
    },
};

function state(): any {
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
