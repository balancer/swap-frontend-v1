export const ETH_KEY = 'ether';

export function getTokenAddress(symbol: string): string {
    const addresses: Record<string, string> = {
        ETH: ETH_KEY,
        WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        BAL: '0xba100000625a3754423978a60c9317c58a424e3D',
    };
    return addresses[symbol];
}

export function getTokenDecimals(address: string): number {
    const decimals: Record<string, number> = {
        [ETH_KEY]: 18,
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 18,
        '0x6B175474E89094C44Da98b954EedeAC495271d0F': 18,
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 6,
        '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 8,
        '0xba100000625a3754423978a60c9317c58a424e3D': 18,
    };
    return decimals[address];
}
