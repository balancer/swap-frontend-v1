<template>
    <div class="modal-wrapper">
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
                    <img
                        :src="closeIcon"
                        class="close-icon"
                        @click="$emit('close')"
                    >
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
</template>

<script>
import { defineComponent } from 'vue';

import closeIcon from '@/assets/closeIcon.svg';

export default defineComponent({
    props: {
        title: {
            type: String,
            required: true,
        },
    },
    emits: ['close'],
    setup() {
        return {
            closeIcon,
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
</style>
