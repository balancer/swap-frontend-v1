<template>
    <div class="footer">
        <div class="links">
            <a
                href="https://pools.balancer.exchange/"
                target="_blank"
            >
                Pool Management
            </a>
            <a
                href="https://claim.balancer.finance"
                target="_blank"
            >
                Claim BAL
            </a>
            <a
                href="https://vote.balancer.finance/"
                target="_blank"
            >
                Governance
            </a>
        </div>
        <div class="links">
            <a
                href="https://discord.com/invite/ARJWaeF"
                target="_blank"
            >
                Discord
            </a>
            <a
                href="https://docs.balancer.finance/"
                target="_blank"
            >
                Docs
            </a>
            <a
                href="https://help.balancer.finance/en/"
                target="_blank"
            >
                Help
            </a>
        </div>
    </div>
</template>

<style scoped>
.footer {
    height: 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.links {
    margin: 16px;
}

a {
    margin-left: 8px;
    text-decoration: none;
    color: var(--text-secondary);
}

a:hover {
    color: var(--text-primary);
}
</style>
