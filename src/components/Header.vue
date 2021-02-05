<template>
    <div class="header">
        <div class="header-left">
            <router-link
                class="brand"
                :to="'/'"
            >
                <img
                    class="logo"
                    :src="logo"
                >
                <span class="title">Balancer</span>
            </router-link>
            <div class="page-links">
                <div
                    class="link active"
                >
                    Trade
                </div>
                <a
                    class="link"
                    href="https://pools.balancer.exchange"
                    target="_blank"
                >
                    Invest
                </a>
            </div>
        </div>
        <div class="header-right">
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
    background: var(--background-primary);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid var(--border);
}

.header-left {
    display: flex;
}

.header-right {
    display: flex;
    align-items: center;
}

a {
    text-decoration: none;
    color: var(--text-primary);
}

.brand {
    margin-left: 20px;
    display: flex;
    align-items: center;
}

.logo {
    height: 27px;
}

.title {
    margin-left: 12px;
    font-size: 22px;
}

.page-links {
    display: flex;
    align-items: end;
    margin-left: 48px;
}

.link {
    margin-right: 20px;
    color: var(--text-secondary);
    cursor: pointer;
}

.link.active {
    color: var(--text-primary);
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
