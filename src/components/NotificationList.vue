<template>
    <div class="list">
        <Notification
            v-for="item in items"
            :key="item.link"
            :type="item.type"
            :text="item.text"
            :link="item.link"
        />
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
</style>
