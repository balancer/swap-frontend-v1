import { TokenMetadata } from '@/api/ethereum';

export const ETH_KEY = 'ether';

export function getAssetAddressBySymbol(assets: TokenMetadata[], symbol: string): string | undefined {
    const asset = getAssetBySymbol(assets, symbol);
    if (!asset) {
        return;
    }
    return asset.address;
}

function getAssetBySymbol(assets: TokenMetadata[], symbol: string): TokenMetadata | undefined {
    const assetAddress = Object.keys(assets).find(assetAddress => {
        const asset = assets[assetAddress];
        return asset.symbol === symbol;
    });
    if (!assetAddress) {
        return;
    }
    return assets[assetAddress];
}
