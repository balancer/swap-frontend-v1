import { InfuraProvider } from '@ethersproject/providers';

import config from '@/config';

const provider = new InfuraProvider(config.network, config.infuraKey);

export default provider;
