var restify  = require('restify');

const corsMiddleware = require('restify-cors-middleware');
const cors = corsMiddleware({
  origins: ['*']
});


var mongodb  = require('mongodb').MongoClient;
var url      = "mongodb://localhost:27017/cloudking";

var server  = restify.createServer();
server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser());


accounts   = require('./accounts');

server.post('/accounts', accounts.post);
server.post('/accounts/auth', accounts.auth);
server.post('/accounts/payment', accounts.payment);
 server.get('/accounts', accounts.get);
 server.get('/accounts/:value', accounts.getByValue);
 server.put('/accounts', accounts.put);
 server.del('/accounts/:value', accounts.delete);


server.listen(3000, function() {
    console.log('%s listening at %s', server.name, server.url);
});
