import { MaxUint256 } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import BigNumber from 'bignumber.js';

import config from '@/config';

import ERC20Abi from '../abi/ERC20.json';
import WethAbi from '../abi/Weth.json';

export default class Helper {
    static async unlock(
        provider: Web3Provider,
        asset: string,
        spender: string,
    ): Promise<any> {
        const assetContract = new Contract(asset, ERC20Abi, provider.getSigner());
        try {
            return await assetContract.approve(spender, MaxUint256);
        } catch(e) {
            return e;
        }
    }

    static async wrap(
        provider: Web3Provider,
        amount: BigNumber,
    ): Promise<any> {
        const wethContract = new Contract(config.addresses.weth, WethAbi, provider.getSigner());
        const overrides = {
            value: `0x${amount.toString(16)}`,
        };
        try {
            return await wethContract.deposit(overrides);
        } catch(e) {
            return e;
        }
    }

    static async unwrap(
        provider: Web3Provider,
        amount: BigNumber,
    ): Promise<any> {
        const wethContract = new Contract(config.addresses.weth, WethAbi, provider.getSigner());
        try {
            return await wethContract.withdraw(amount.toString(), {});
        } catch(e) {
            return e;
        }
    }

    static async getGasPrice(
        provider: Web3Provider,
    ): Promise<any> {
        const gasPrice = await provider.getGasPrice();
        return gasPrice.toString();
    }
}
