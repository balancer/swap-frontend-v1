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
            const address = props.address;
            const metadata = store.getters['assets/metadata'];
            const assetMetadata = metadata[address];

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
