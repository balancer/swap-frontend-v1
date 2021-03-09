import { RootState } from '@/store';
import { ActionContext } from 'vuex';

import { getPrices } from '@/utils/price';

export interface PriceState {
    prices: Record<string, number>;
}

const mutations = {
    setPrices: (_state: PriceState, prices: Record<string, number>): void => {
        for (const address in prices) {
            _state.prices[address] = prices[address];
        }
    },
};

const actions = {
    init: async({ dispatch }: ActionContext<PriceState, RootState>): Promise<void> => {
        dispatch('fetchPrices');
    },
    fetchPrices: async({ commit }: ActionContext<PriceState, RootState>): Promise<void> => {
        const assets = ['ethereum', 'balancer'];
        const prices = await getPrices(assets);
        commit('setPrices', prices);
    },
};

function state(): PriceState {
    return {
        prices: {},
    };
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
};
