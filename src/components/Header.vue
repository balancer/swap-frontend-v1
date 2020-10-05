<template>
    <div class="header">
        <router-link :to="'/'">
            <div class="brand">
                <img
                    class="logo"
                    :src="logo"
                >
                <span class="title">Balancer</span>
            </div>
        </router-link>
        <Account class="account" />
    </div>
</template>

<script>
import { defineComponent } from 'vue';

import logo from '@/assets/logo.svg';

import Account from '@/components/Account.vue';

export default defineComponent({
    components: {
        Account,
    },
    setup() {
        return {
            logo,
        };
    },
});
</script>

<style scoped>
.header {
    height: 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

a {
    text-decoration: none;
    color: var(--text-primary);
}

.brand {
    margin-left: 16px;
    display: flex;
    align-items: center;
}

.logo {
    height: 32px;
    width: 32px;
}

.title {
    margin-left: 16px;
}

.account {
    margin-right: 16px;
}
</style>
