<template>
    <div id="app">
        <router-view />
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
    setup() {
        const store = useStore();

        onMounted(() => {
            store.dispatch('account/init');
        });

        return {};
    },
});
</script>

<style>
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', Helvetica, Arial, sans-serif;
}
</style>
