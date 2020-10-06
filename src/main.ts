import { createApp } from 'vue';
import { createWebHistory, createRouter } from 'vue-router';
import store from './store';

import App from './App.vue';

import Swap from './pages/Swap.vue';

const routerHistory = createWebHistory();
const router = createRouter({
    history: routerHistory,
    routes: [
        { path: '/', redirect: '/swap' },
        { path: '/swap', name: 'swap', component: Swap },
    ],
});

const app = createApp(App);

app.use(router);
app.use(store);

app.mount('#app');

export {
    routerHistory,
    router,
    store,
};
