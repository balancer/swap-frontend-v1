import { createApp } from 'vue';
import { createWebHistory, createRouter } from 'vue-router';
import store from './store';

import App from './App.vue';

import Main from './pages/Main.vue';

const routerHistory = createWebHistory();
const router = createRouter({
    history: routerHistory,
    routes: [
        { path: '/', component: Main },
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
