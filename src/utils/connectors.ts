import { Lock } from '@snapshot-labs/lock/src';
import injected from '@snapshot-labs/lock/connectors/injected';
import fortmatic from '@snapshot-labs/lock/connectors/fortmatic';
import portis from '@snapshot-labs/lock/connectors/portis';
import walletconnect from '@snapshot-labs/lock/connectors/walletconnect';
import walletlink from '@snapshot-labs/lock/connectors/walletlink';

import config from '@/config';

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
