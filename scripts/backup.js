const axios = require('axios');

const fs = require('fs');

const subgraphClient = axios.create({
    baseURL: 'https://api.thegraph.com/subgraphs/name/balancer-labs',
    headers: { 'Content-Type': 'application/json' },
});

const endpointUrl = {
    1: 'balancer-beta',
    42: 'balancer-kovan',
};

async function run() {
    const homesteadPools = await getPools(1);
    const kovanPools = await getPools(42);
    const pools = {
        1: homesteadPools,
        42: kovanPools,
    };
    const backupFile = 'src/pools.json';
    fs.writeFileSync(backupFile, JSON.stringify(pools, null, 4));
}

async function getPools(chainId) {
    const PER_PAGE = 1000;
    const allPools = [];
    let pools = [];
    let skip = 0;
    do {
        const query = `
            query {
                pools(
                    first: ${PER_PAGE},
                    skip: ${skip},
                    where: {
                        publicSwap: true,
                        active: true,
                    },
                ) {
                    id
                    swapFee
                    totalWeight
                    publicSwap
                    tokens {
                        id
                        address
                        balance
                        decimals
                        symbol
                        denormWeight
                    }
                    tokensList
                }
            }`;
        const response = await subgraphClient.post(endpointUrl[chainId], {
            query,
        });
        const data = response.data.data;
        for (const pool of data.pools) {
            allPools.push(pool);
        }
        pools = [];
        skip += PER_PAGE;
    } while (pools.length > 0);
    return allPools;
}

run();
