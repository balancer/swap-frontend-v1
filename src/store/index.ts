import { createStore } from 'vuex';

import account from './modules/account';
import tokens from './modules/tokens';

const store = createStore({
    modules: {
        account,
        tokens,
    },
});

export default store;
