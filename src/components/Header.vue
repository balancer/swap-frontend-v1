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
        <div class="header-right">
            <a
                class="link"
                href="https://pools.balancer.exchange"
                target="_blank"
            >
                Add Liquidity
            </a>
            <Account class="account" />
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';

import logo from '@/assets/logo.svg';
import title from '@/assets/title.svg';

import Account from '@/components/Account.vue';

export default defineComponent({
    components: {
        Account,
    },
    setup() {
        return {
            logo,
            title,
        };
    },
});
</script>

<style scoped>
.header {
    height: 96px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--background-header);
    box-shadow: 0 5px 10px 0 rgba(0, 0, 0, 0.15);
}

.header-right {
    display: flex;
    align-items: center;
}

.link {
    margin-right: 8px;
}

a {
    text-decoration: none;
    color: var(--text-primary);
}

.brand {
    margin-left: 40px;
    display: flex;
    align-items: center;
}

.logo {
    height: 40px;
    width: 40px;
}

.title {
    margin-left: 16px;
    font-size: 20px;
}

.account {
    margin-left: 8px;
    margin-right: 16px;
}

@media only screen and (max-width: 768px) {
    .brand {
        margin-left: 16px;
    }

    .title {
        display: none;
    }

    .link {
        display: none;
    }
}
</style>
