import config from '@/config';

const actionToGoalId = {
    swapIn: 'OAXZQIBH',
    swapOut: 'ZT892CNN',
    approve: 'ST3CSJFO',
};

export function setGoal(action: string, value = 0): void {
    const id = actionToGoalId[action];
    if (window['fathom'] && config.chainId === 1 && id)
        window['fathom'].trackGoal(id, value);
}

if (config.chainId === 1) {
    const script = document.createElement('script');
    script.setAttribute('src', 'https://cdn.usefathom.com/script.js');
    script.setAttribute('data-spa', 'auto');
    script.setAttribute('data-site', 'YRAWPOKJ');
    script.setAttribute('honor-dnt', 'true');
    script.setAttribute('defer', '');
    document.head.appendChild(script);
}
