import { createStore } from 'vuex';

import account from './modules/account';

const store = createStore({
    modules: {
        account,
    },
});

export default store;
