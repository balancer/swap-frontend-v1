<template>
    <div class="message">
        Earn BAL when swapping between <a
            href="https://forum.balancer.finance/t/proposal-balancer-exchange-gas-reimbursement/799"
            target="_blank"
        >
            eligible tokens</a>.
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
