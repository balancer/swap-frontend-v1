<template>
    <div
        class="notification"
        :class="{
            success: type === 'success',
            warning: type === 'warning',
            error: type === 'error',
        }"
    >
        <Icon
            :title="icon"
            class="icon"
        />
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
                :link="link"
            />
        </div>
        <div class="progress" />
    </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

import Icon from '@/components/Icon.vue';
import NotificationButton from '@/components/NotificationButton.vue';

export default defineComponent({
    components: {
        Icon,
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
        link: {
            type: String,
            default: '',
        },
    },
    setup(props) {
        const icon = computed(() => {
            if (props.type === 'success') {
                return 'success';
            } else {
                return 'error';
            }
        });

        const title = computed(() => {
            if (props.type === 'success') {
                return 'Success';
            } else {
                return 'Error';
            }
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
    animation-name: slide;
    animation-duration: 10000ms;
}

.icon {
    width: 24px;
    height: 24px;
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
    font-weight: bold;
}

.body-text {
    font-size: 14px;
}

.button-wrapper {
    margin-left: 8px;
}

.progress {
    position: fixed;
    height: 2px;
    bottom: 0;
    left: 0;
    background: white;
    animation-name: grow;
    animation-duration: 10000ms;
}

@keyframes slide {
    0% {
        opacity: 0;
        transform: translateX(300px);
    }

    10% {
        opacity: 1;
        transform: translateX(0);
    }

    90% {
        opacity: 1;
        transform: translateX(0);
    }

    100% {
        opacity: 0;
        transform: translateX(300px);
    }
}

@keyframes grow {
    0% {
        width: 0;
    }

    100% {
        width: 100%;
    }
}
</style>
