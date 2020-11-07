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
                    <div class="header-top">
                        <div>
                            {{ title }}
                        </div>
                        <Icon
                            class="close-icon"
                            :title="'close'"
                            @click="$emit('close')"
                        />
                    </div>
                    <slot
                        class="header-bottom"
                        name="header"
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
    background: rgba(0, 0, 0, 0.4);
}

.modal {
    width: 440px;
    max-height: 90%;
    z-index: 3;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--background-secondary);
    border-radius: var(--border-radius);
    border: 1px solid var(--outline);
}

.appear-enter > .modal {
    transform: scale(0.9);
}

.appear-enter-active > .modal {
    animation: grow 0.2s ease-out;
}

.appear-leave-active > .modal {
    animation: grow 0.2s ease-out reverse;
}

.header {
    padding: 16px;
    border-bottom: 1px solid var(--outline);
}

.header-top {
    display: flex;
    justify-content: space-between;
    font-weight: 700;
}

.close-icon {
    width: 20px;
    height: 20px;
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

    80% {
        transform: scale(1.02);
    }

    100% {
        transform: scale(1);
    }
}
</style>
