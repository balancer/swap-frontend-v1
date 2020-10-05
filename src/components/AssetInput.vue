<template>
    <div class="input">
        <div class="amount-wrapper">
            <input
                :value="amount"
                class="amount"
                @input="$emit('change'); $emit('update:amount', $event.target.value)"
            >
        </div>
        <div class="asset-wrapper">
            <div class="asset-meta">
                <div class="asset-logo" />
                <span class="asset-symbol">{{ symbol }}</span>
            </div>
            <img
                class="chevron-icon"
                :src="chevronIcon"
            >
        </div>
    </div>
</template>

<script>
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import chevronIcon from '../assets/chevronIcon.svg';

export default defineComponent({
    props: {
        address: {
            type: String,
            required: true,
        },
        amount: {
            type: String,
            required: true,
        },
    },
    emits: ['update:amount', 'change'],
    setup(props) {
        const store = useStore();
        const tokens = store.state.tokens.metadata;

        const symbol = computed(() => {
            const token = tokens[props.address];
            if (!token) {
                return '';
            }
            return token.symbol;
        });

        return {
            chevronIcon,
            symbol,
        };
    },
});
</script>

<style scoped>
.input {
    display: flex;
    height: var(--block-height);
    border: 1px solid var(--outline);
    border-radius: 4px;
    background: var(--background-secondary);
}

.amount-wrapper {
    display: flex;
    border-right: 1px solid var(--outline);
    border-radius: 4px;
}

.amount {
    width: 200px;
    margin-right: 8px;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 16px;
    text-align: right;
    outline: none;
}

.asset-wrapper {
    width: 120px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.asset-meta {
    display: flex;
    align-items: center;
}

.asset-logo {
    width: 16px;
    height: 16px;
    box-sizing: border-box;
    margin-left: 8px;
    border: 1px solid white;
    border-radius: 8px;
}

.asset-symbol {
    margin-left: 4px;
}

.chevron-icon {
    margin-right: 4px;
}
</style>
