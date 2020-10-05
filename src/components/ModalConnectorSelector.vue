<template>
    <ModalBase
        :title="'Select Wallet'"
        @close="close"
    >
        <template #default>
            <div
                v-for="connector in connectors"
                :key="connector.key"
                class="connector"
                @click="select(connector.key)"
            >
                <img
                    :src="
                        `https://raw.githubusercontent.com/bonustrack/lock/master/connectors/assets/${connector.key}.png`
                    "
                    height="20"
                    width="20"
                >
                <div class="connector-title">
                    {{ connector.title }}
                </div>
            </div>
        </template>
    </ModalBase>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import config from '@/config';

import ModalBase from '@/components/ModalBase.vue';

export default defineComponent({
    components: {
        ModalBase,
    },
    setup() {
        const store = useStore();

        const connectors = computed(() => {
            return Object.keys(config.connectors).map(connectorKey => {
                const connector = config.connectors[connectorKey];
                return {
                    key: connector.id,
                    title: connector.name,
                };
            });
        });

        function select(connectorKey: string): void {
            close();
            store.dispatch('account/connect', connectorKey);
        }

        function close(): void {
            store.dispatch('ui/closeConnectorModal');
        }

        return {
            connectors,
            select,
            close,
        };
    },
});
</script>

<style scoped>
.connector {
    display: flex;
    padding: 16px;
    border-bottom: 1px solid var(--outline);
    cursor: pointer;
}

.connector:hover {
    background: var(--outline);
}

.connector-title {
    margin-left: 16px;
}
</style>
