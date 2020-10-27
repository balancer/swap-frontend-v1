<template>
    <div class="popup-wrapper">
        <div class="icon-wrapper">
            <Icon
                class="icon"
                :title="'info'"
            />
        </div>
        <div class="popup">
            <div class="header">
                Order has been split into {{ swaps.length }} routes:
            </div>
            <div
                v-for="(hops, index) in swaps"
                :key="index"
                class="swap"
            >
                <div
                    v-for="hop in hops"
                    :key="hop"
                    class="hop"
                >
                    {{ formatAddress(hop.pool) }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import Icon from '@/components/Icon.vue';

export default defineComponent({
    components: {
        Icon,
    },
    props: {
        swaps: {
            type: Array,
            required: true,
        },
    },
    setup() {
        function formatAddress(address: string): string {
            return `${address.substr(0, 6)}…${address.substr(38)}`;
        }

        return {
            formatAddress,
        };
    },
});
</script>

<style scoped>
.popup-wrapper {
    position: relative;
}

.icon-wrapper {
    height: 16px;
}

.icon {
    width: 16px;
    height: 16px;
}

.popup {
    width: 240px;
    background-color: var(--background-secondary);
    border-radius: var(--border-radius);
    padding: 8px;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    margin-left: -129px;
    border: 1px solid var(--outline);
    display: none;
    flex-direction: column;
    align-items: center;
}

.header {
    margin-bottom: 8px;
}

.icon-wrapper:hover + .popup {
    display: flex;
}

.swap {
    display: flex;
}

.hop:not(:last-child)::after {
    content: '⭢';
    margin: 0 4px;
}
</style>
