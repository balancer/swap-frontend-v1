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
        <div
            class="progress"
            :style="{ width: `${(progress * 100).toFixed(0)}%` }"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { TransitionPresets, useTransition } from '@vueuse/core';

import { NOTIFICATION_DURATION } from '@/store/modules/ui';

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
        const totalProgress = ref(0);

        const progress = useTransition(totalProgress, {
            duration: NOTIFICATION_DURATION,
            transition: TransitionPresets.linear,
        });

        onMounted(() => {
            totalProgress.value = 1;
        });

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
            progress,
        };
    },
});
</script>

<style scoped>
.notification {
    position: relative;
    width: 280px;
    margin-top: 16px;
    padding: 16px;
    box-sizing: border-box;
    display: flex;
    border-radius: var(--border-radius-small);
    justify-content: space-between;
    align-items: center;
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
    width: 0%;
    height: 4px;
    position: absolute;
    bottom: 0;
    left: 0;
    background: white;
    opacity: 0.8;
    transition: width 1s linear;
}
</style>
