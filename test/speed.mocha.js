'use strict';

var runWithMutex = require('..').runWithMutex;

describe('Performance test', function () {

  it('run 1000 times', function (done) {

    this.timeout(20000);

    // Speed test
    // Inspired by https://medium.com/@the1mills/a-better-mutex-for-node-js-4b4897fd9f11
    var a = Array.apply(null, {length: 1000});

    var start = Date.now();

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
      console.log(' => Time required => ', Date.now() - start);
      done();
    })
    .catch(done);
  });

});
