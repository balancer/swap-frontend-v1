// @ts-ignore
import merge from 'lodash/merge';
import registry from 'assets/generated/pm/registry.homestead.json';
import registryKovan from 'assets/generated/pm/registry.kovan.json';

import { clone } from '@/utils/helpers';
import homestead from './homestead.json';
import staging from './homestead.staging.json';
import kovan from './kovan.json';

// eslint-disable-next-line no-undef
const env = process.env.VUE_APP_ENV || 'production';
// eslint-disable-next-line no-undef
const network = process.env.VUE_APP_NETWORK || 'homestead';

const configs = {
    production: { homestead, kovan },
    staging: { homestead: merge(clone(homestead), staging), kovan },
};

configs.production.homestead = merge(registry, configs.production.homestead);
configs.production.kovan = merge(registryKovan, configs.production.kovan);
configs.staging.homestead = merge(registry, configs.staging.homestead);
configs.staging.kovan = merge(registryKovan, configs.staging.kovan);

// @ts-ignore
export default configs[env][network];
