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
            <Icon
                class="icon"
                :title="'externalLink'"
            />
        </div>
    </a>
</template>

<script>
import { defineComponent, computed } from 'vue';

import Icon from '@/components/Icon.vue';

export default defineComponent({
    components: {
        Icon,
    },
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
    border-radius: var(--border-radius-small);
    display: flex;
    align-items: center;
    font-size: 14px;
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
}
</style>
