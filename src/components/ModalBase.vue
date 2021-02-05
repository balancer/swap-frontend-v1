<template>
    <transition
        name="appear"
    >
        <div
            v-if="open"
            class="modal-wrapper"
        >
            <div
                class="backdrop"
                @click="$emit('close')"
            />
            <div class="modal">
                <div class="header">
                    <div>
                        {{ title }}
                    </div>
                    <Icon
                        class="close-icon"
                        :title="'close'"
                        @click="$emit('close')"
                    />
                </div>
                <div class="body">
                    <slot />
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { defineComponent } from 'vue';

import Icon from '@/components/Icon.vue';

export default defineComponent({
    components: {
        Icon,
    },
    props: {
        title: {
            type: String,
            required: true,
        },
        open: {
            type: Boolean,
            required: true,
        },
    },
    emits: ['close'],
});
</script>

<style scoped>
.appear-enter {
    opacity: 0;
}

.appear-enter-active {
    animation: appear 0.2s ease-out;
}

.appear-leave-active {
    animation: appear 0.2s ease-out reverse;
}

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
    background: rgba(0, 0, 0, 0.8);
}

.modal {
    width: 440px;
    max-height: 90%;
    z-index: 3;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--background-primary);
    border-radius: var(--border-radius-large);
}

.appear-enter > .modal {
    transform: scale(0.9);
}

.appear-enter-active > .modal {
    animation: grow 0.2s cubic-bezier(0.38, 0, 0.6, 1.48);
}

.appear-leave-active > .modal {
    animation: grow 0.2s cubic-bezier(0.38, 0, 0.6, 1.48) reverse;
}

.header {
    min-height: 96px;
    box-sizing: border-box;
    padding: 0 18px 24px 18px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-size: 22px;
    font-weight: bold;
    background: var(--background-secondary);
}

.close-icon {
    width: 16px;
}

.body {
    overflow-y: auto;
}

@keyframes appear {
    0% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

@keyframes grow {
    0% {
        transform: scale(0.9);
    }

    100% {
        transform: scale(1);
    }
}

@media only screen and (max-width: 768px) {
    .modal-wrapper {
        align-items: flex-start;
    }

    .modal {
        border-radius: 0;
        max-height: 100%;
    }
}
</style>
