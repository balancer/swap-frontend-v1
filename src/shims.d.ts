declare module '*.vue' {
    import { ComponentOptions } from 'vue';
    const component: ComponentOptions;
    export default component;
}

declare module '*.svg' {
    const content: any;
    export default content;
}

interface Window {
    ethereum: any;
}

declare const APP_COMMIT: string;
