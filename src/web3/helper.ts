import { MaxUint256 } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';

import ERC20Abi from '../abi/ERC20.json';

export default class Helper {
    static async unlock(
        provider: any,
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
}
