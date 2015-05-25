/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var request = require('request-json');
var auth = require('basic-auth');

var QUANTIFIED_SERVER = 'http://localhost:3000';

// Get list of things
exports.index = function(req, res) {
  res.json(QUANTIFIED_SERVER);
  };

exports.getRecentRecords = function(req, res) {
  var client = request.createClient(QUANTIFIED_SERVER);
  client.get('records.json', function(err, res2, body) {
    res.json(body);
  });
};

exports.getToken = function(req, res) {
  var client = request.createClient(QUANTIFIED_SERVER);
  var auth = require('basic-auth');
  var user = auth(req);
  client.post('api/v1/tokens.json',
              {login: user.name, password: user.pass},
              function(err, res2, body) {
                res.json(body);
              });
  
};
