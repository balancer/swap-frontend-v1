import { AlchemyProvider, InfuraProvider } from '@ethersproject/providers';

import config from '@/config';

const provider = new InfuraProvider(config.network, config.infuraKey);

export default provider;

const debugProvider = new AlchemyProvider(config.network, config.alchemyKey);

export { debugProvider };
