import { Lock } from '@bonustrack/lock/src';
import injected from '@bonustrack/lock/connectors/injected';
import fortmatic from '@bonustrack/lock/connectors/fortmatic';
import portis from '@bonustrack/lock/connectors/portis';
import walletconnect from '@bonustrack/lock/connectors/walletconnect';
import walletlink from '@bonustrack/lock/connectors/walletlink';

import config from '../config';

const lock = new Lock();

const connectors = { injected, fortmatic, portis, walletconnect, walletlink };

for (const connectorKey in connectors) {
    const connector = {
        key: connectorKey,
        connector: connectors[connectorKey],
        options: config.connectors[connectorKey].options,
    };
    lock.addConnector(connector);
}

export default lock;
