import { RootState } from '@/store';
import { ActionContext } from 'vuex';

import Helper from '@/web3/helper';

// eslint-disable-next-line no-undef
const DEFAULT_PRICE = process.env.APP_GAS_PRICE || '100000000000';

export interface GasState {
    price: string;
}

const mutations = {
    setPrice: (_state: GasState, price: string): void => {
        _state.price = price;
    },
};

const actions = {
    init: async({ dispatch }: ActionContext<GasState, RootState>): Promise<void> => {
        dispatch('fetchPrice');
    },
    fetchPrice: async({ commit, rootGetters }: ActionContext<GasState, RootState>): Promise<void> => {
        const provider = await rootGetters['account/provider'];
        const price = await Helper.getGasPrice(provider);
        commit('setPrice', price);
    },
};

function state(): GasState {
    return {
        price: DEFAULT_PRICE,
    };
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
};
