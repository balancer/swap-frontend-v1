const CONNECTOR = 'connector';
const INPUT_ASSET = 'input_asset';
const OUTPUT_ASSET = 'output_asset';

export default class Storage {
    static getConnector(): string | null {
        const connector = localStorage.getItem(CONNECTOR);
        return connector;
    }

    static getInputAsset(): string | null {
        const asset = localStorage.getItem(INPUT_ASSET);
        return asset;
    }

    static getOutputAsset(): string | null {
        const asset = localStorage.getItem(OUTPUT_ASSET);
        return asset;
    }

    static saveConnector(connector: string): void {
        localStorage.setItem(CONNECTOR, connector);
    }

    static saveInputAsset(asset: string): void {
        localStorage.setItem(INPUT_ASSET, asset);
    }

    static saveOutputAsset(asset: string): void {
        localStorage.setItem(OUTPUT_ASSET, asset);
    }

    static clearConnector(): void {
        localStorage.removeItem(CONNECTOR);
    }
}
