export const ETH_KEY = 'ether';

export function getAssetAddressBySymbol(assets: any, symbol: string): any {
    const asset = getAssetBySymbol(assets, symbol);
    return asset.address;
}

function getAssetBySymbol(assets: any[], symbol: string): any {
    const assetAddress = Object.keys(assets).find(assetAddress => {
        const asset = assets[assetAddress];
        return asset.symbol === symbol;
    });
    if (!assetAddress) {
        return;
    }
    return assets[assetAddress];
}
