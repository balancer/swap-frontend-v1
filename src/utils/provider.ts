import { AlchemyProvider } from '@ethersproject/providers';

import config from '@/config';

const provider = new AlchemyProvider(config.network, config.alchemyKey);

export default provider;

const debugProvider = new AlchemyProvider(config.network, config.alchemyKey);

export { debugProvider };
