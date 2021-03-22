<template>
    <div id="app">
        <Header />
        <router-view class="view" />

        <ModalSettings :open="isSettingsModalOpen" />
        <ModalAccount :open="isAccountModalOpen" />
        <ModalConnectorSelector :open="isConnectorModalOpen" />
        <NotificationList
            :items="notifications"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';
import Storage from '@/utils/storage';

import Header from '@/components/Header.vue';
import ModalAccount from '@/components/ModalAccount.vue';
import ModalConnectorSelector from '@/components/ModalConnectorSelector.vue';
import ModalSettings from '@/components/ModalSettings.vue';
import NotificationList from '@/components/NotificationList.vue';

export default defineComponent({
    components: {
        Header,
        ModalAccount,
        ModalConnectorSelector,
        ModalSettings,
        NotificationList,
    },
    setup() {
        const store = useStore<RootState>();

        const isSettingsModalOpen = computed(() => store.state.ui.modal.settings.isOpen);
        const isAccountModalOpen = computed(() => store.state.ui.modal.account.isOpen);
        const isConnectorModalOpen = computed(() => store.state.ui.modal.connector.isOpen);

        const notifications = computed(() => store.state.ui.notifications);

        const mode = Storage.isDarkmode();
        if (mode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        onMounted(() => {
            store.dispatch('assets/init');
            store.dispatch('account/init');
            store.dispatch('gas/init');
            store.dispatch('bal4gas/init');
            store.dispatch('price/init');
        });

        return {
            isSettingsModalOpen,
            isAccountModalOpen,
            isConnectorModalOpen,
            notifications,
        };
    },
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700&display=swap');

:root {
    --background-primary: #fafafa;
    --background-secondary: #fff;
    --background-control: #fff;
    --background-hover: #f5f5f5;
    --border: #e5e5e5;
    --text-primary: #21222c;
    --text-secondary: #718b98;
    --success: #21b66f;
    --info: #7685d5;
    --warning: #ff9a1a;
    --error: #ff5b4c;
    --font-size-tiny: 11px;
    --font-size-small: 14px;
    --font-size-medium: 16px;
    --font-size-large: 18px;
    --font-size-header: 24px;
    --border-radius-large: 25px;
    --border-radius-medium: 10px;
    --border-radius-small: 5px;
    --block-height: 50px;
}

[data-theme="dark"] {
    --background-primary: #1c1d26;
    --background-secondary: #21222c;
    --background-control: #1f2029;
    --background-hover: #20222c;
    --border: #333;
    --text-primary: #fff;
    --text-secondary: #98aab4;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: var(--font-size-medium);
    margin: 0;
    background: var(--background-primary);
    color: var(--text-primary);
}

input {
    appearance: textfield;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input:invalid {
    box-shadow: none;
}

.view {
    min-height: calc(100vh - 80px);
    display: flex;
    align-items: center;
    justify-content: center;
}

@media only screen and (max-width: 768px) {
    .brand {
        margin-left: 16px;
    }

    .title {
        display: none;
    }

    .view {
        min-height: initial;
    }
}
</style>
