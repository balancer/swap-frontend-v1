import { WebSocketProvider } from '@ethersproject/providers';

import config from '@/config';

const provider = new WebSocketProvider(config.alchemyWsUrl, config.chainId);

export default provider;
