import { MaxUint256 } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { ErrorCode } from '@ethersproject/logger';
import { Web3Provider } from '@ethersproject/providers';

import { logRevertedTx } from '@/utils/helpers';

import ERC20Abi from '../abi/ERC20.json';

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
            if (e.code === ErrorCode.UNPREDICTABLE_GAS_LIMIT) {
                const sender = await provider.getSigner().getAddress();
                logRevertedTx(sender, assetContract, 'approve', [spender, MaxUint256], {});
            }
            return e;
        }
    }
}
