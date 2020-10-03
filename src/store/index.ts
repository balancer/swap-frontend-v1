import { createStore } from 'vuex';

import web3 from './modules/web3.ts';

const store = createStore({
    modules: {
        web3,
    },
});

export default store;
