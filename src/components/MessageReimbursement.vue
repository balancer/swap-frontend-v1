<template>
    <div class="message">
        <h3>Gas fees too high? Here's a helping hand</h3>
        <span>
            This trade will earn you up to
            <a
                href="https://forum.balancer.finance/t/proposal-balancer-exchange-gas-reimbursement/799"
                target="_blank"
            >
                $12.34 (1.2 BAL)*</a></span>
    </div>
</template>

<script></script>

<style scoped>
.message {
    position: relative;
    margin: 40px 0 0;
    padding: 20px 40px;
    /* border: 1px solid var(--info); */
    border-radius: var(--border-radius-medium);
    /* color: var(--info); */
    color: var(--text-primary);
    background: linear-gradient(185deg, #f0f 0%, #00f 100%);
}

.message::before {
    content: '👏';
    position: absolute;
    top: 2px;
    left: 2px;
    bottom: 2px;
    right: 2px;
    padding: 20px;
    border-radius: var(--border-radius-medium);
    z-index: 1;
    text-align: left;
    font-size: 32px;
    background: var(--background-control);
}

.message span {
    color: var(--text-secondary);
}
.message a {
    text-decoration: none;
    font-weight: bold;
    color: var(--text-secondary);
}
.message a:hover {
    text-decoration: underline;
}

.message > h3,
.message > span {
    margin: 0 0 0 30px;
    z-index: 2;
    position: relative;
}

@media only screen and (max-width: 768px) {
    .message {
        width: initial;
    }
}
</style>
