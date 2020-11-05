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
                :size="16"
            />
            <div class="account-address">
                {{ formatAddress(address) }}
            </div>
        </div>
        <Icon
            class="chevron-icon"
            :title="'chevron'"
        />
    </div>
    <Button
        v-else
        :text="'Connect'"
        :primary="true"
        :loading="loading"
        :disabled="loading"
        @click="openConnectorModal"
    />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';
import { formatAddress } from '@/utils/helpers';

import Button from '@/components/Button.vue';
import Icon from '@/components/Icon.vue';
import Jazzicon from '@/components/Jazzicon.vue';

export default defineComponent({
    components: {
        Button,
        Icon,
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
    border: 1px solid var(--outline);
    border-radius: var(--border-radius);
    background: var(--background-secondary);
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
    width: 16px;
    height: 16px;
    box-sizing: border-box;
    border-radius: 8px;
}

.account-address {
    margin-left: 4px;
}

.chevron-icon {
    width: 16px;
    height: 16px;
}
</style>
