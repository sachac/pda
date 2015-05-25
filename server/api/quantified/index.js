'use strict';

var express = require('express');
var controller = require('./quantified.controller');
var proxy = require('express-http-proxy');
var QUANTIFIED_SERVER = 'http://localhost:3000';

var router = express.Router();

router.get('/', controller.index);
router.get('/getToken', controller.getToken);

module.exports = router;
