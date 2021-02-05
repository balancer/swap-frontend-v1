<template>
    <ModalBase
        :title="'Select Wallet'"
        :open="open"
        @close="close"
    >
        <template #default>
            <div
                v-for="connector in connectors"
                :key="connector.id"
                class="connector"
                @click="select(connector.id)"
            >
                <img
                    :src="connector.logo"
                    class="connector-icon"
                >
                <div class="connector-title">
                    {{ connector.name }}
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
import { hasInjectedProvider, getConnectorName, getConnectorLogo } from '@/utils/connectors';

import ModalBase from '@/components/ModalBase.vue';

export default defineComponent({
    components: {
        ModalBase,
    },
    props: {
        open: {
            type: Boolean,
            required: true,
        },
    },
    setup() {
        const store = useStore<RootState>();

        const connectors = computed(() => {
            return Object.keys(config.connectors)
                .filter(connectorId => {
                    if (connectorId === 'injected') {
                        return hasInjectedProvider();
                    }
                    return true;
                })
                .map(connectorId => {
                    return {
                        id: connectorId,
                        name: getConnectorName(connectorId),
                        logo: getConnectorLogo(connectorId),
                    };
                });
        });

        function select(connectorId: string): void {
            close();
            store.dispatch('account/connect', connectorId);
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
    border-bottom: 1px solid var(--border);
    cursor: pointer;
}

.connector:hover {
    background: var(--background-secondary);
}

.connector-icon {
    width: 20px;
    height: 20px;
}

.connector-title {
    margin-left: 16px;
}
</style>
