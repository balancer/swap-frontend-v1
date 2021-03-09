import { createStore } from 'vuex';

import account, { AccountState } from './modules/account';
import assets, { AssetState } from './modules/assets';
import price, { PriceState } from './modules/price';
import ui, { UIState } from './modules/ui';

export interface RootState {
	account: AccountState;
	assets: AssetState;
	price: PriceState;
	ui: UIState;
}

const store = createStore({
    modules: {
        account,
        assets,
        price,
        ui,
    },
});

export default store;
