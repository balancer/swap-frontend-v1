export const ETH_KEY = 'ether';

export function getTokenAddressBySymbol(tokens: any, symbol: string): any {
    const token = getTokenBySymbol(tokens, symbol);
    return token.address;
}

function getTokenBySymbol(tokens: any[], symbol: string): any {
    const tokenAddress = Object.keys(tokens).find(tokenAddress => {
        const token = tokens[tokenAddress];
        return token.symbol === symbol;
    });
    if (!tokenAddress) {
        return;
    }
    return tokens[tokenAddress];
}
