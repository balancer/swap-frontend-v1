<template>
    <a
        :href="link"
        target="_blank"
    >
        <div
            class="button"
            :class="{
                success: type === 'success',
                warning: type === 'warning',
                error: type === 'error',
            }"
        >
            {{ text }}
            <img
                class="icon"
                :src="externalLinkIcon"
            >
        </div>
    </a>
</template>

<script>
import { defineComponent, computed } from 'vue';

import externalLinkIcon from '@/assets/externalLinkIcon.svg';

export default defineComponent({
    props: {
        type: {
            type: String,
            required: true,
        },
        link: {
            type: String,
            required: true,
        },
    },
    setup(props) {
        const text = computed(() => {
            const textMap = {
                'success': 'Receipt',
                'warning': 'Help',
                'error': 'Details',
            };
            return textMap[props.type];
        });

        return {
            text,
            externalLinkIcon,
        };
    },
});
</script>

<style scoped>
a {
    text-decoration: none;
}

.button {
    padding: 4px;
    background: var(--text-primary);
    border: none;
    border-radius: 4px;
    display: flex;
    align-items: center;
    font-size: 10px;
}

.success {
    color: var(--success);
}

.warning {
    color: var(--error);
}

.error {
    color: var(--error);
}

.icon {
    margin-left: 4px;
    width: 8px;
    height: 8px;
}
</style>
