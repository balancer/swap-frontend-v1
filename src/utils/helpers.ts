import BigNumber from 'bignumber.js';
import { getAddress } from '@ethersproject/address';

import config from '@/config';

export function formatAddress(address: string, length = 8): string {
    const ellipsizedAddress = `${address.substr(0, 2 + length / 2)}…${address.substr(42 - length / 2)}`;
    return ellipsizedAddress;
}

export function formatTxHash(txHash: string, length = 16): string {
    const ellipsizedHash = `${txHash.substr(0, 2 + length / 2)}…${txHash.substr(66 - length / 2)}`;
    return ellipsizedHash;
}

export function isAddress(value: string): boolean {
    try {
        getAddress(value);
    } catch(e) {
        return false;
    }
    return true;
}

export function scale(input: BigNumber, decimalPlaces: number): BigNumber {
    const scalePow = new BigNumber(decimalPlaces.toString());
    const scaleMul = new BigNumber(10).pow(scalePow);
    return input.times(scaleMul);
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

export function getEtherscanLink(txHash: string): string {
    const chainId = config.chainId;
    const prefixMap = {
        1: '',
        42: 'kovan.',
    };
    const prefix = prefixMap[chainId];
    const link = `https://${prefix}etherscan.io/tx/${txHash}`;
    return link;
}

export function getPoolLink(pool: string): string {
    const chainId = config.chainId;
    const prefixMap = {
        1: '',
        42: 'kovan.',
    };
    const prefix = prefixMap[chainId];
    const link = `https://${prefix}pools.balancer.exchange/#/pool/${pool}`;
    return link;
}
