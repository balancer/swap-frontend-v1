<template>
    <div class="header">
        <div class="header-left">
            <router-link
                class="brand"
                :to="'/'"
            >
                <Icon
                    class="logo"
                    :title="'brand'"
                />
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

import Account from '@/components/Account.vue';
import Icon from '@/components/Icon.vue';

export default defineComponent({
    components: {
        Account,
        Icon,
    },
});
</script>

<style scoped>
.header {
    height: 80px;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--background-primary);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid var(--border);
}

.header-left,
.header-right {
    display: flex;
    align-items: end;
}

a {
    text-decoration: none;
    color: var(--text-primary);
}

.brand {
    margin-left: 20px;
    display: flex;
    align-items: end;
}

.logo {
    height: 22px;
    width: 27px;
}

.title {
    margin-left: 12px;
    font-size: var(--font-size-large);
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
