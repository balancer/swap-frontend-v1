import { Lock } from '@snapshot-labs/lock/src';
import injected from '@snapshot-labs/lock/connectors/injected';
import fortmatic from '@snapshot-labs/lock/connectors/fortmatic';
import portis from '@snapshot-labs/lock/connectors/portis';
import walletconnect from '@snapshot-labs/lock/connectors/walletconnect';
import walletlink from '@snapshot-labs/lock/connectors/walletlink';

import fortmaticLogo from '@/assets/connector/fortmatic.png';
import frameLogo from '@/assets/connector/frame.png';
import imtokenLogo from '@/assets/connector/imtoken.png';
import metamaskLogo from '@/assets/connector/metamask.png';
import portisLogo from '@/assets/connector/portis.png';
import statusLogo from '@/assets/connector/status.png';
import trustwalletLogo from '@/assets/connector/trustwallet.png';
import walletconnectLogo from '@/assets/connector/walletconnect.png';
import walletlinkLogo from '@/assets/connector/walletlink.png';
import web3Logo from '@/assets/connector/web3.png';

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

export function getConnectorLogo(connectorId: string): string {
    if (connectorId === 'injected') {
        const provider = window.ethereum;
        if (provider.isMetaMask) {
            return metamaskLogo;
        }
        if (provider.isImToken) {
            return imtokenLogo;
        }
        if (provider.isStatus) {
            return statusLogo;
        }
        if (provider.isTrust) {
            return trustwalletLogo;
        }
        if (provider.isFrame) {
            return frameLogo;
        }
        return web3Logo;
    }
    if (connectorId === 'fortmatic') {
        return fortmaticLogo;
    }
    if (connectorId === 'portis') {
        return portisLogo;
    }
    if (connectorId === 'walletconnect') {
        return walletconnectLogo;
    }
    if (connectorId === 'walletlink') {
        return walletlinkLogo;
    }
    return web3Logo;
}

export default lock;
