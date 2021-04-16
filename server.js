var path = require('path');
var express = require('express');

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


var server = app.listen(app.get('port'), function() {
  console.log('listening on port ', server.address().port);
});
