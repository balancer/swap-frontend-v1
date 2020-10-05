<template>
    <div
        v-if="address"
        class="account-wrapper"
        @click="openModal"
    >
        <div class="account-meta">
            <div class="account-icon" />
            <div class="account-address">
                {{ address }}
            </div>
        </div>
        <img
            class="chevron-icon"
            :src="chevronIcon"
        >
    </div>
    <Button
        v-else
        :text="'Connect'"
        :primary="true"
    />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import chevronIcon from '@/assets/chevronIcon.svg';

import { formatAddress } from '@/utils/helpers';

import Button from '@/components/Button.vue';

export default defineComponent({
    components: {
        Button,
    },
    setup() {
        const store = useStore();

        const address = computed(() => {
            const { web3Provider, address } = store.state.account;
            if (!web3Provider || !address) {
                return '';
            }
            return formatAddress(address);
        });

        function openModal(): void {
            store.dispatch('ui/openAccountModal');
        }

        return {
            chevronIcon,
            address,
            openModal,
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
    border: 1px solid white;
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
