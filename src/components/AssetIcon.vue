<template>
    <img :src="assetIcon">
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import defaultIcon from '@/assets/defaultAssetIcon.svg';

import config from '@/config';
import { RootState } from '@/store';

export default defineComponent({
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    setup(props) {
        const store = useStore<RootState>();

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
            return assetMetadata.logoUrl;
        });

        return {
            assetIcon,
        };
    },
});
</script>
