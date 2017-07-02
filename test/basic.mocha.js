'use strict';

var Promise = require('bluebird');
var runWithMutex = require('..').runWithMutex;
var freeMutex = require('..').freeMutex;

describe('Basic test', function () {

  beforeEach(function (done) {
    freeMutex('bazinga').asCallback(done);
  })

  it('should correctly run async methods', function (done) {

     this.timeout(5000);

    function delayedLog(msg, delay) {
      return new Promise(function (resolve, reject) {
        console.log(new Date(), 'A:', msg);
        setTimeout(function () {
          console.log(new Date(), 'B:', msg);
          resolve(msg);
        }, delay);
      });
    }

    var p1 = runWithMutex('bazinga1', function () { return delayedLog(1, 1000); }).then(console.log);
    var p2 = runWithMutex('bazinga1', function () { return delayedLog(2, 1000); }).then(console.log);
    var p3 = runWithMutex('bazinga2', function () { return delayedLog(3, 1000); }).then(console.log);
    var p4 = runWithMutex('bazinga2', function () { return delayedLog(4, 1000); }).then(console.log);

    Promise.all([p1, p2, p3, p4]).asCallback(done);
  });

});
