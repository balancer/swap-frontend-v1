<template>
    <div class="list">
        <transition-group name="slide">
            <Notification
                v-for="item in items"
                :key="item.link"
                :type="item.type"
                :text="item.text"
                :link="item.link"
            />
        </transition-group>
    </div>
</template>

<script>
import { defineComponent } from 'vue';

import Notification from '@/components/Notification.vue';

export default defineComponent({
    components: {
        Notification,
    },
    props: {
        items: {
            type: Array,
            required: true,
        },
    },
});
</script>

<style scoped>
.list {
    position: fixed;
    bottom: 16px;
    right: 16px;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: translateX(300px);
}

.slide-enter-active,
.slide-leave-active {
    transition: all 1s cubic-bezier(0.5, 0, 0.54, 1.42);
}

.slide-move {
    transition: all 0.5s ease;
}
</style>
