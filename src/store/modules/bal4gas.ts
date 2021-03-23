import { RootState } from '@/store';
import { ActionContext } from 'vuex';

import { isBudgetLeft } from '@/utils/bal4gas';

export interface Bal4GasState {
    bal4gas: number;
}

const mutations = {
    setBal4Gas: (_state: Bal4GasState, bal4gas: number): void => {
        _state.bal4gas = bal4gas;
    },
};

const actions = {
    init: async({ dispatch }: ActionContext<Bal4GasState, RootState>): Promise<void> => {
        dispatch('fetchBal4Gas');
    },
    fetchBal4Gas: async({ commit }: ActionContext<Bal4GasState, RootState>): Promise<void> => {
        const budgetLeft = await isBudgetLeft();
        const bal4gas = budgetLeft ? 1 : 0;
        commit('setBal4Gas', bal4gas);
    },
};

function state(): Bal4GasState {
    return {
        bal4gas: -1,
    };
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
};
