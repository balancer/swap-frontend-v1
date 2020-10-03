import BigNumber from 'bignumber.js';

export function scale(input: BigNumber, decimalPlaces: number): BigNumber {
    const scalePow = new BigNumber(decimalPlaces.toString());
    const scaleMul = new BigNumber(10).pow(scalePow);
    return input.times(scaleMul);
}

export function clone(item: any): any {
    return JSON.parse(JSON.stringify(item));
}
