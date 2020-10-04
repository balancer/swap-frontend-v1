<template>
    <div id="app">
        <Header />
        <router-view />
        <Footer class="footer" />
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { useStore } from 'vuex';

import Header from './components/Header.vue';
import Footer from './components/Footer.vue';

export default defineComponent({
    components: {
        Header,
        Footer,
    },
    setup() {
        const store = useStore();

        onMounted(() => {
            store.dispatch('tokens/init');
            store.dispatch('account/init');
        });

        return {};
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

.footer {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
}
</style>
