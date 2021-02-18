<template>
    <div
        v-if="address"
        class="account-wrapper"
        @click="openAccountModal"
    >
        <div class="account-meta">
            <Jazzicon
                class="account-icon"
                :address="address"
                :size="28"
            />
            <div class="account-address">
                {{ formatAddress(address) }}
            </div>
        </div>
    </div>
    <Button
        v-else
        :text="'Connect'"
        :primary="false"
        :loading="loading"
        :disabled="loading"
        class="connect-button"
        @click="openConnectorModal"
    />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';
import { formatAddress } from '@/utils/helpers';

import Button from '@/components/Button.vue';
import Jazzicon from '@/components/Jazzicon.vue';

export default defineComponent({
    components: {
        Button,
        Jazzicon,
    },
    setup() {
        const store = useStore<RootState>();

        const address = computed(() => {
            const { connector, address } = store.state.account;
            if (!connector || !connector.id || !address) {
                return '';
            }
            return address;
        });

        const loading = computed(() => {
            const { connector, address } = store.state.account;
            return !!connector && !!connector.id && !address;
        });

        function openAccountModal(): void {
            store.dispatch('ui/openAccountModal');
        }

        function openConnectorModal(): void {
            store.dispatch('ui/openConnectorModal');
        }

        return {
            address,
            loading,
            formatAddress,
            openAccountModal,
            openConnectorModal,
        };
    },
});
</script>

<style scoped>
.account-wrapper {
    height: var(--block-height);
    width: 170px;
    padding: 8px;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid var(--border);
    border-radius: var(--border-radius-small);
    background: var(--background-control);
    cursor: pointer;
}

.account-wrapper:hover {
    background: var(--background-primary);
}

.account-meta {
    display: flex;
    align-items: center;
}

.account-icon {
    width: 28px;
    height: 28px;
    box-sizing: border-box;
    border-radius: 50%;
}

.account-address {
    margin-left: 8px;
}

.connect-button {
    width: 170px;
}
</style>
