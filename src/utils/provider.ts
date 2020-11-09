import { JsonRpcProvider } from '@ethersproject/providers';

import config from '@/config';

const provider = new JsonRpcProvider(config.alchemyUrl, config.chainId);

export default provider;
