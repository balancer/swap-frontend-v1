import config from '../../config';

const mutations = {
    addMetadata: (_state: any, metadata: any): void => {
        for (const tokenAddress in metadata) {
            _state.metadata[tokenAddress] = metadata[tokenAddress];
        }
    },
};

const actions = {
    init: ({ commit }: any): void => {
        const metadata = config.tokens;
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
