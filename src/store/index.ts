import { createStore } from 'vuex';

import account, { AccountState } from './modules/account';
import assets, { AssetState } from './modules/assets';
import ui, { UIState } from './modules/ui';

export interface RootState {
	account: AccountState;
	assets: AssetState;
	ui: UIState;
}

const store = createStore({
    modules: {
        account,
        assets,
        ui,
    },
});

export default store;
