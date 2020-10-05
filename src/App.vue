<template>
    <div id="app">
        <Header />
        <router-view class="view" />
        <Footer class="footer" />

        <ModalAccount v-if="isAccountModalOpen" />
        <ModalConnectorSelector v-if="isConnectorModalOpen" />
    </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

import Header from './components/Header.vue';
import Footer from './components/Footer.vue';
import ModalAccount from '@/components/ModalAccount.vue';
import ModalConnectorSelector from '@/components/ModalConnectorSelector.vue';

export default defineComponent({
    components: {
        Header,
        Footer,
        ModalAccount,
        ModalConnectorSelector,
    },
    setup() {
        const store = useStore();

        const isAccountModalOpen = computed(() => store.state.ui.modal.account.isOpen);
        const isConnectorModalOpen = computed(() => store.state.ui.modal.connector.isOpen);

        onMounted(() => {
            store.dispatch('assets/init');
            store.dispatch('account/init');
        });

        return {
            isAccountModalOpen,
            isConnectorModalOpen,
        };
    },
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');

:root {
    --background-primary: #21222c;
    --background-secondary: #282932;
    --outline: #41476b;
    --accent: #536dfe;
    --text-primary: #fff;
    --text-secondary: #90a4ae;
    --info: #7685d5;
    --warning: #ffc780;
    --error: #ff8a80;
    --border-radius: 4px;
    --block-height: 40px;
}

body {
    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    margin: 0;
    background: var(--background-primary);
    color: var(--text-primary);
}

.view {
    height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.footer {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
}
</style>
