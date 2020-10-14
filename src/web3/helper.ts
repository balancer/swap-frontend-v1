import { ethers } from 'ethers';

import ERC20Abi from '../abi/ERC20.json';

import { getCancelledTx } from '@/utils/helpers';

const uintMax = ethers.constants.MaxUint256;

export default class Helper {
    static async unlock(
        provider: any,
        asset: string,
        spender: string,
    ): Promise<any> {
        const assetContract = new ethers.Contract(asset, ERC20Abi, provider.getSigner());
        try {
            return await assetContract.approve(spender, uintMax);
        } catch(e) {
            return getCancelledTx(e);
        }
    }
}
