<template>
    <div class="message">
        Balancer is partially reimbursing gas costs for some trades 🎉
        <a
            href="https://medium.com/balancer-protocol/exchange-gas-reimbursements-8326db66cab2"
            target="_blank"
        >
            Learn more
        </a>
    </div>
</template>

<script>
    
</script>

<style scoped>
.message {
    width: 385px;
    margin: 10px;
    padding: 20px 40px;
    border: 1px solid var(--info);
    border-radius: var(--border-radius-large);
    color: var(--info);
}

.message > a {
    color: var(--info);
}

@media only screen and (max-width: 768px) {
    .message {
        width: initial;
    }
}
</style>
