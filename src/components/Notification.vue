<template>
    <div
        class="notification"
        :class="{
            success: type === 'success',
            warning: type === 'warning',
            error: type === 'error',
        }"
    >
        <div class="meta">
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
.notification {
    width: 280px;
    margin-top: 16px;
    padding: 16px;
    box-sizing: border-box;
    display: flex;
    border-radius: var(--border-radius);
    justify-content: space-between;
    align-items: center;
    animation-name: slide;
    animation-duration: 30000ms;
}

.meta {
    display: flex;
    align-items: center;
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
    max-width: 140px;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    animation-duration: 30000ms;
}

@keyframes slide {
    0% {
        opacity: 0;
        transform: translateX(300px);
    }

    5% {
        opacity: 1;
        transform: translateX(0);
    }

    95% {
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
