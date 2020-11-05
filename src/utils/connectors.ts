import { Lock } from '@snapshot-labs/lock/src';
import injected from '@snapshot-labs/lock/connectors/injected';
import fortmatic from '@snapshot-labs/lock/connectors/fortmatic';
import portis from '@snapshot-labs/lock/connectors/portis';
import walletconnect from '@snapshot-labs/lock/connectors/walletconnect';
import walletlink from '@snapshot-labs/lock/connectors/walletlink';

import config from '@/config';

const lock = new Lock();

const connectors = { injected, fortmatic, portis, walletconnect, walletlink };

for (const connectorId in connectors) {
    const connector = {
        key: connectorId,
        connector: connectors[connectorId],
        options: config.connectors[connectorId],
    };
    lock.addConnector(connector);
}

export function getConnectorName(connectorId: string): string {
    if (connectorId === 'injected') {
        const provider = window.ethereum;
        if (provider.isMetaMask) {
            return 'MetaMask';
        }
        if (provider.isImToken) {
            return 'imToken';
        }
        if (provider.isStatus) {
            return 'Status';
        }
        if (provider.isTrust) {
            return 'Trust Wallet';
        }
        if (provider.isFrame) {
            return 'Frame';
        }
        return 'Browser Wallet';
    }
    if (connectorId === 'fortmatic') {
        return 'Fortmatic';
    }
    if (connectorId === 'portis') {
        return 'Portis';
    }
    if (connectorId === 'walletconnect') {
        return 'Walletconnect';
    }
    if (connectorId === 'walletlink') {
        return 'Walletlink';
    }
    return 'Unknown';
}

export default lock;
