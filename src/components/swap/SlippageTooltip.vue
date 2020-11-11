<template>
    <div class="tooltip-wrapper">
        <div class="icon-wrapper">
            <Icon
                class="icon"
                :title="'info'"
            />
        </div>
        <div class="tooltip">
            <div class="header">
                Price impact (slippage)
            </div>
            <div class="paragraph">
                Slippage shows how much swap price deviates from the current spot price. The higher the swap size the higher the slippage.
            </div>
            <div class="paragraph">
                Buffer allows you to increase the chance of successful swap. The higher the buffer, the more likely that the transaction will pass, but the final swap rate might be worse.
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';

import Icon from '@/components/Icon.vue';

export default defineComponent({
    components: {
        Icon,
    },
});
</script>

<style scoped>
.tooltip-wrapper {
    position: relative;
}

.icon-wrapper {
    height: 16px;
}

.icon {
    width: 16px;
    height: 16px;
}

.tooltip {
    width: 280px;
    z-index: 1;
    bottom: 100%;
    left: 50%;
    margin-left: -149px;
    margin-bottom: 8px;
    padding: 8px;
    position: absolute;
    display: flex;
    flex-direction: column;
    visibility: hidden;
    opacity: 0;
    color: var(--text-primary);
    border: 1px solid var(--outline);
    background-color: var(--background-secondary);
    border-radius: var(--border-radius);
    transition: opacity 0.125s ease-in, visibility 0.125s ease-in;
}

.tooltip:hover {
    visibility: visible;
    opacity: 1;
}

.tooltip::before {
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -8px;
    content: "";
    border-style: solid;
    border-color: var(--outline) transparent transparent transparent;
    border-width: 8px;
}

.tooltip::after {
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -7px;
    content: "";
    border-style: solid;
    border-color: var(--background-secondary) transparent transparent transparent;
    border-width: 7px;
}

.header {
    margin-bottom: 8px;
    color: var(--text-secondary);
    font-size: 14px;
    text-align: center;
}

.icon-wrapper:hover + .tooltip {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.125s ease-out, visibility 0.125s ease-out;
}

.paragraph {
    margin-top: 8px;
}
</style>
