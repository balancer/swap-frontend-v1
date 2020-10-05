<template>
    <div class="modal-wrapper">
        <div
            class="backdrop"
            @click="close"
        />
        <div class="modal modal-connector">
            <div class="header">
                <div>
                    Select Wallet
                </div>
                <img
                    :src="closeIcon"
                    class="close-icon"
                    @click="close"
                >
            </div>
            <div class="body">
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
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import closeIcon from '@/assets/closeIcon.svg';

import config from '@/config';

export default defineComponent({
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
            closeIcon,
            connectors,
            select,
            close,
        };
    },
});
</script>

<style scoped>
.modal-wrapper {
    position: fixed;
    display: flex;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    align-items: center;
    justify-content: center;
    z-index: 1;
}

.backdrop {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
    background: rgba(0, 0, 0, 0.4);
}

.modal {
    max-height: 90%;
    z-index: 3;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--background-secondary);
    border-radius: var(--border-radius);
    border: 1px solid var(--outline);
}

.modal-connector {
    width: 440px;
}

.header {
    display: flex;
    justify-content: space-between;
    padding: 16px;
    font-weight: 700;
    border-bottom: 1px solid var(--outline);
}

.close-icon {
    width: 20px;
    height: 20px;
}

.body {
    overflow-y: auto;
}

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
