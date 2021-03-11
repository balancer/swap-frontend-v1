import { createStore } from 'vuex';

import account, { AccountState } from './modules/account';
import assets, { AssetState } from './modules/assets';
import gas, { GasState } from './modules/gas';
import price, { PriceState } from './modules/price';
import ui, { UIState } from './modules/ui';

export interface RootState {
	account: AccountState;
	assets: AssetState;
    gas: GasState;
	price: PriceState;
	ui: UIState;
}

const store = createStore({
    modules: {
        account,
        assets,
        gas,
        price,
        ui,
    },
});

export default store;
