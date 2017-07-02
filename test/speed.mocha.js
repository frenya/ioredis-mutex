'use strict';
const assert = require('assert');

var runWithMutex = require('..').runWithMutex;
var freeMutex = require('..').freeMutex;

describe('Performance test', function () {

  beforeEach(function (done) {
    freeMutex('speed-test').asCallback(done);
  })

  it('run 10000 times', function (done) {

    var length = 5000;

    this.timeout(length * 2);

    // Speed test
    // Inspired by https://medium.com/@the1mills/a-better-mutex-for-node-js-4b4897fd9f11
    var a = Array.apply(null, {length: length});

    var i = 0;

    Promise.all(a.map(function (val) {
      return runWithMutex('speed-test', function () {
        // console.log('unlocking...' + i++);
        process.stdout.write('unlocking...' + i++ + '\r');
        return val;
      })
      .catch(console.error);
    }))
    .then(function () {
      assert.equal(i, length);
      done();
    })
    .catch(done);
  });

});
