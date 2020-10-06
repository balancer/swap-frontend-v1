<template>
    <img :src="assetIcon">
</template>

<script>
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import defaultIcon from '@/assets/defaultAssetIcon.svg';

import config from '@/config';

export default defineComponent({
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    setup(props) {
        const store = useStore();

        const assetIcon = computed(() => {
            let address = props.address;
            const { metadata } = store.state.assets;
            const assetMetadata = metadata[address];

            if (address === 'ether') {
                address = config.addresses.weth;
            }
            if (!assetMetadata) {
                return defaultIcon;
            }
            if (!assetMetadata.hasIcon) {
                return defaultIcon;
            }
            return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
        });

        return {
            assetIcon,
        };
    },
});
</script>
