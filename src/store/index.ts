import { createStore } from 'vuex';

import account from './modules/account';
import assets from './modules/assets';

const store = createStore({
    modules: {
        account,
        assets,
    },
});

export default store;
