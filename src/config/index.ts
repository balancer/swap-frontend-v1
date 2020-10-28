import homesteadAssets from 'assets/generated/dex/registry.homestead.json';
import kovanAssets from 'assets/generated/dex/registry.kovan.json';

import homestead from './homestead.json';
import kovan from './kovan.json';

const configs = {
    1: {...homesteadAssets, ...homestead},
    42:{...kovanAssets, ...kovan},
};
// eslint-disable-next-line no-undef
const network = process.env.APP_CHAIN_ID || 1;

export default configs[network];
