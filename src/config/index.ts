// @ts-ignore
import merge from 'lodash/merge';
import registry from 'assets/generated/dex/registry.homestead.json';
import registryKovan from 'assets/generated/dex/registry.kovan.json';

import homestead from './homestead.json';
import kovan from './kovan.json';

const configs = { homestead, kovan };
configs.homestead = merge(registry, configs.homestead);
configs.kovan = merge(registryKovan, configs.kovan);
// eslint-disable-next-line no-undef
const network = process.env.VUE_APP_NETWORK || 'homestead';

// @ts-ignore
export default configs[network];
