<template>
    <img
        :src="assetIcon"
        @error="handleError"
    >
</template>

<script lang="ts">
import { defineComponent, computed, ref, toRefs, watch } from 'vue';
import { useStore } from 'vuex';

import defaultIcon from '@/assets/defaultAssetIcon.svg';

import { ETH_KEY } from '@/utils/helpers';
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

        const loadingFailed = ref(false);

        const { address } = toRefs(props);

        watch(address, () => {
            loadingFailed.value = false;
        });

        const assetIcon = computed(() => {
            let address = props.address;
            const { metadata } = store.state.assets;
            const assetMetadata = metadata[address];

            if (address === ETH_KEY) {
                address = config.addresses.weth;
            }
            if (!assetMetadata) {
                return defaultIcon;
            }
            if (loadingFailed.value) {
                return defaultIcon;
            }
            return assetMetadata.logoURI;
        });

        function handleError(): void {
            loadingFailed.value = true;
        }

        return {
            assetIcon,
            handleError,
        };
    },
});
</script>
