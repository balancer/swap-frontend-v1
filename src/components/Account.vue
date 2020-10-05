<template>
    <div class="account">
        <div
            v-if="address"
            class="address"
        >
            <span class="jazzicon" />
            {{ address }}
        </div>
        <div
            v-else
            class="connect"
        >
            Connect
        </div>
    </div>
</template>

<script>
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import { formatAddress } from '@/utils/helpers';

export default defineComponent({
    setup() {
        const store = useStore();

        const address = computed(() => {
            const { web3Provider, address } = store.state.account;
            if (!web3Provider || !address) {
                return '';
            }
            return formatAddress(address);
        });

        return {
            address,
        };
    },
});
</script>

<style scoped>
.account {
    height: var(--block-height);
    width: 160px;
    padding: 8px;
    box-sizing: border-box;
    border: 1px solid var(--outline);
    border-radius: var(--border-radius);
    background: var(--background-secondary);
    text-align: right;
    cursor: pointer;
}

.account:hover {
    background: var(--background-primary);
}

.address {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.jazzicon {
    width: 16px;
    height: 16px;
    box-sizing: border-box;
    border: 1px solid white;
    border-radius: 8px;
}

.connect {
    text-align: center;
}
</style>
