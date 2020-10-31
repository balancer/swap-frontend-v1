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
                <ConnectorIcon
                    :connector="connector.key"
                    class="connector-icon"
                />
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
import { RootState } from '@/store';

import ConnectorIcon from '@/components/ConnectorIcon.vue';
import ModalBase from '@/components/ModalBase.vue';

export default defineComponent({
    components: {
        ConnectorIcon,
        ModalBase,
    },
    setup() {
        const store = useStore<RootState>();

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

.connector-icon {
    width: 20px;
    height: 20px;
}

.connector-title {
    margin-left: 16px;
}
</style>
