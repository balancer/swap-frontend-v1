<template>
    <div class="footer">
        <div class="links links-left">
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
                Claim
            </a>
            <a
                href="https://vote.balancer.finance/"
                target="_blank"
            >
                Vote
            </a>
        </div>
        <div class="links links-right">
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

@media only screen and (max-width: 768px) {
    .footer {
        height: 96px;
    }

    .links {
        display: flex;
        flex-direction: column;
        margin: 0 16px;
    }

    a {
        margin: 4px;
    }

    .links-right > a {
        text-align: right;
    }
}
</style>
