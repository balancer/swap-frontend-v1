<template>
    <div
        class="notification"
        :class="{
            success: type === 'success',
            warning: type === 'warning',
            error: type === 'error',
        }"
    >
        <img :src="icon">
        <div class="body">
            <div class="body-title">
                {{ title }}
            </div>
            <div class="body-text">
                {{ text }}
            </div>
        </div>
        <div class="button-wrapper">
            <NotificationButton
                :type="type"
                :link="'https://etherscan.io/'"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

import NotificationButton from './NotificationButton.vue';

import successIcon from '@/assets/successIcon.svg';
import errorIcon from '@/assets/errorIcon.svg';

export default defineComponent({
    components: {
        NotificationButton,
    },
    props: {
        type: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
    },
    setup(props) {
        const icon = computed(() => {
            const iconMap = {
                'success': successIcon,
                'warning': errorIcon,
                'error': errorIcon,
            };
            return iconMap[props.type];
        });

        const title = computed(() => {
            const titleMap = {
                'success': 'Success',
                'warning': 'Error',
                'error': 'Error',
            };
            return titleMap[props.type];
        });

        return {
            icon,
            title,
        };
    },
});
</script>

<style scoped>
.notification-wrapper {
    position: fixed;
    z-index: 1;
}

.notification {
    position: fixed;
    z-index: 2;
    bottom: 16px;
    right: 16px;
    padding: 16px;
    box-sizing: border-box;
    display: flex;
    border-radius: var(--border-radius);
    align-items: center;
}

.success {
    background: var(--success);
}

.warning {
    background: var(--error);
}

.error {
    background: var(--error);
}

.body {
    margin-left: 8px;
}

.body-title {
    font-size: 16px;
}

.body-text {
    font-size: 10px;
}

.button-wrapper {
    margin-left: 8px;
}
</style>
