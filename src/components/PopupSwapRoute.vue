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
                    <a
                        :href="getPoolLink(hop.pool)"
                        target="_blank"
                        class="pool-link"
                    >
                        {{ formatAddress(hop.pool) }}
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { formatAddress, getPoolLink } from '@/utils/helpers';

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
        return {
            formatAddress,
            getPoolLink,
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
    z-index: 1;
    bottom: 100%;
    left: 50%;
    margin-left: -129px;
    margin-bottom: 8px;
    padding: 8px;
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    visibility: hidden;
    border: 1px solid var(--outline);
    background-color: var(--background-secondary);
    border-radius: var(--border-radius);
}

.popup:hover {
    visibility: visible;
}

.popup::before {
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -8px;
    content: "";
    border-style: solid;
    border-color: var(--outline) transparent transparent transparent;
    border-width: 8px;
}

.popup::after {
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -7px;
    content: "";
    border-style: solid;
    border-color: var(--background-secondary) transparent transparent transparent;
    border-width: 7px;
}

.header {
    margin-bottom: 8px;
}

.icon-wrapper:hover + .popup {
    visibility: visible;
}

.swap {
    display: flex;
}

.hop:not(:last-child)::after {
    content: '⭢';
    margin: 0 4px;
}

.pool-link {
    color: var(--info);
}
</style>
