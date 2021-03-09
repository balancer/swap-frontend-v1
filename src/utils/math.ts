import BigNumber from 'bignumber.js';

const BONE = new BigNumber(10).pow(18);

export function bmul(a: BigNumber, b: BigNumber): BigNumber {
    const c0 = a.times(b);
    const c1 = c0.plus(BONE.div(new BigNumber(2)));
    const c2 = c1.idiv(BONE);
    return c2;
}

export function bdiv(a: BigNumber, b: BigNumber): BigNumber {
    const c0 = a.times(BONE);
    const c1 = c0.plus(b.div(new BigNumber(2)));
    const c2 = c1.idiv(b);
    return c2;
}

export function calcSpotPrice(
    tokenBalanceIn: BigNumber,
    tokenWeightIn: BigNumber,
    tokenBalanceOut: BigNumber,
    tokenWeightOut: BigNumber,
): BigNumber {
    const numer = bdiv(tokenBalanceIn, tokenWeightIn);
    const denom = bdiv(tokenBalanceOut, tokenWeightOut);
    const ratio = bdiv(numer, denom);
    return ratio;
}
