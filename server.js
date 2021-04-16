var path = require('path');
var express = require('express');
const https = require('https')

var app = express();

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    if (req.method === 'OPTIONS') {
      return res.send(200);
    } else {
      return next();
    }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.set('port', process.env.PORT || 8080);


app.get('/pools', (req, res) => {
    const data = JSON.stringify({
        "query": "query { pools (where: {active: true, tokensCount_gt: 1, finalized: true, tokensList_not: []}, first: 20, skip: 0, orderBy: \"liquidity\", orderDirection: \"desc\") { id publicSwap finalized crp rights swapFee totalWeight totalShares totalSwapVolume liquidity tokensList swapsCount tokens (orderBy: \"denormWeight\", orderDirection: \"desc\") { id address balance decimals symbol denormWeight } swaps (first: 1, orderBy: \"timestamp\", orderDirection: \"desc\", where: {timestamp_lt: 1618488000}) { poolTotalSwapVolume } } }"
      });
    
    const options = {
        hostname: 'api.thegraph.com',
        port: 443,
        path: '/subgraphs/name/cron-md/multitoken',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          'Accept': 'application/json',

        }
      }
    
    const treq = https.request(options, tres => {
      console.log(`statusCode: ${res.statusCode}`)
    
      tres.on('data', d => {
        res.write(d)
      })
    })
    
    treq.on('error', error => {
      console.error(error)
    })
    
    treq.write(data)
    treq.end()
})

var server = app.listen(app.get('port'), function() {
  console.log('listening on port ', server.address().port);
});
