import { ethers } from 'ethers';

import ERC20Abi from '../abi/ERC20.json';

const uintMax = ethers.constants.MaxUint256;

export default class Helper {
    static async unlock(
        provider: any,
        asset: string,
        spender: string,
    ): Promise<void> {
        const assetContract = new ethers.Contract(asset, ERC20Abi, provider.getSigner());
        await assetContract.approve(spender, uintMax);
    }
}
