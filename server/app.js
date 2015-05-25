/**
 * Main application file
 */

'use strict';
var QUANTIFIED_SERVER = 'http://localhost:3000';
var os = require('os');
if (os.hostname() == 'direct.sachachua.com') {
  QUANTIFIED_SERVER = 'http://quantifiedawesome.com';
}

var proxy = require('express-http-proxy');

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var config = require('./config/environment');
var auth = require('basic-auth-connect');
// Setup server
var app = express();
var server = require('http').createServer(app);


app.use(auth(function(user, pass) {
  return user == 'sacha';
}));
        
app.use('/quantified', proxy(QUANTIFIED_SERVER, { forwardPath: function(req, res) {
  return require('url').parse(req.url).path;  
}}));


require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
