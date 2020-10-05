import { createStore } from 'vuex';

import account from './modules/account';
import assets from './modules/assets';
import ui from './modules/ui';

const store = createStore({
    modules: {
        account,
        assets,
        ui,
    },
});

export default store;
