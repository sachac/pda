'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');

describe('GET /quantified/records', function() {
  /* Hard to test for now
  it('should respond with JSON', function(done) {
    request(app)
      .get('/quantified/records')
      .auth('sacha', 'notreal')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.entries.should.be.instanceof(Array);
        done();
      });
  }); */
});
