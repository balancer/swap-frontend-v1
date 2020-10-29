import { RootState } from '@/store';
import { sleep } from '@/utils/helpers';
import { ActionContext } from 'vuex';

export interface UIState {
    modal: {
        asset: {
            isOpen: boolean;
            key: string;
        };
        account: {
            isOpen: boolean;
        };
        connector: {
            isOpen: boolean;
        };
    };
    notification: Notification | null;
}

interface Notification {
    text: string;
    type: 'success' | 'error';
    link: string;
}

const mutations = {
    setAssetModalOpen: (_state: UIState, isOpen: boolean): void => {
        _state.modal.asset.isOpen = isOpen;
    },
    setAssetModalKey: (_state: UIState, key: string): void => {
        _state.modal.asset.key= key;
    },
    setAccountModal: (_state: UIState, isOpen: boolean): void => {
        _state.modal.account.isOpen = isOpen;
    },
    setConnectorModal: (_state: UIState, isOpen: boolean): void => {
        _state.modal.connector.isOpen = isOpen;
    },
    setNotification: (_state: UIState, notification: Notification): void => {
        _state.notification = notification;
    },
};

const actions = {
    openAssetModal: ({ commit }: ActionContext<UIState, RootState>, key: string): void => {
        commit('setAssetModalOpen', true);
        commit('setAssetModalKey', key);
    },
    closeAssetModal: ({ commit }: ActionContext<UIState, RootState>): void => {
        commit('setAssetModalOpen', false);
    },
    openAccountModal: ({ commit }: ActionContext<UIState, RootState>): void => {
        commit('setAccountModal', true);
    },
    closeAccountModal: ({ commit }: ActionContext<UIState, RootState>): void => {
        commit('setAccountModal', false);
    },
    openConnectorModal: ({ commit }: ActionContext<UIState, RootState>): void => {
        commit('setConnectorModal', true);
    },
    closeConnectorModal: ({ commit }: ActionContext<UIState, RootState>): void => {
        commit('setConnectorModal', false);
    },
    notify: async ({ commit }: ActionContext<UIState, RootState>, notification: Notification): Promise<void> => {
        commit('setNotification', notification);
        await sleep(10 * 1000);
        commit('setNotification', null);
    },
};

function state(): UIState {
    return {
        modal: {
            asset: {
                isOpen: false,
                key: '',
            },
            account: {
                isOpen: false,
            },
            connector: {
                isOpen: false,
            },
        },
        notification: null,
    };
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
};
