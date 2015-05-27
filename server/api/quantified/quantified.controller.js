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
var config = require('../../config/environment');

// Get list of things
exports.index = function(req, res) {
  res.json(config.quantified_server);
  };

exports.getRecentRecords = function(req, res) {
  var client = request.createClient(config.quantified_server);
  client.get('records.json', function(err, res2, body) {
    res.json(body);
  });
};

