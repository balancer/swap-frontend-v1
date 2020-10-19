import merge from 'lodash/merge';
import registryHomestead from 'assets/generated/dex/registry.homestead.json';
import registryKovan from 'assets/generated/dex/registry.kovan.json';

import homestead from './homestead.json';
import kovan from './kovan.json';

const configs = {
    1: merge(registryHomestead, homestead),
    42: merge(registryKovan, kovan),
};
// eslint-disable-next-line no-undef
const network = process.env.APP_CHAIN_ID || 1;

export default configs[network];
