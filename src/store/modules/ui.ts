import { RootState } from '@/store';
import { sleep } from '@/utils/helpers';
import { ActionContext } from 'vuex';

export const NOTIFICATION_DURATION = 20 * 1000;

export interface UIState {
    modal: {
        asset: {
            isOpen: boolean;
            key: string;
        };
        settings: {
            isOpen: boolean;
        };
        account: {
            isOpen: boolean;
        };
        connector: {
            isOpen: boolean;
        };
    };
    notifications: Notification[];
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
    setSettingsModal: (_state: UIState, isOpen: boolean): void => {
        _state.modal.settings.isOpen = isOpen;
    },
    setAccountModal: (_state: UIState, isOpen: boolean): void => {
        _state.modal.account.isOpen = isOpen;
    },
    setConnectorModal: (_state: UIState, isOpen: boolean): void => {
        _state.modal.connector.isOpen = isOpen;
    },
    addNotification: (_state: UIState, notification: Notification): void => {
        _state.notifications.push(notification);
    },
    removeTopNotification: (_state: UIState): void => {
        _state.notifications.splice(0, 1);
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
    openSettingsModal: ({ commit }: ActionContext<UIState, RootState>): void => {
        commit('setSettingsModal', true);
    },
    closeSettingsModal: ({ commit }: ActionContext<UIState, RootState>): void => {
        commit('setSettingsModal', false);
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
        commit('addNotification', notification);
        await sleep(NOTIFICATION_DURATION);
        commit('removeTopNotification');
    },
};

function state(): UIState {
    return {
        modal: {
            asset: {
                isOpen: false,
                key: '',
            },
            settings: {
                isOpen: false,
            },
            account: {
                isOpen: false,
            },
            connector: {
                isOpen: false,
            },
        },
        notifications: [],
    };
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
};
