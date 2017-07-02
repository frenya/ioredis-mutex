'use strict';

var Promise = require('bluebird');
var Redis = require('ioredis');
var debug = require('debug')('ioredis-mutex');

// Connection used for setting and freeing locks and publishing unlock messages
var redis = new Redis();

// Connection used for listening for unlock messages
var sub = new Redis();

sub.subscribe('mutex-unlock', function (err, count) {
});

// Silence the warning
sub.setMaxListeners(1000);

function getMutex(key, value) {
  return new Promise(function (resolve, reject) {

    function tryLock() {
      redis.set(key, 'mutex', 'NX', function (err, result) {
        if (err) {
          debug('Error getting mutex ' + key + ', ' + err.message);
          reject(err);
        }
        else if (result === 'OK') {
          // Prevent being called again
          sub.removeListener('message', retryLock);
          debug('Got mutex ' + key + ', remaining listeners ' + sub.listeners('message').length);
          resolve(key, value);
        }
      });
    }

    function retryLock(channel, message) {
      if ((channel === 'mutex-unlock') && (message === key)) {
        debug('Retrying mutex ' + key);
        tryLock();
      }
    }

    sub.on('message', retryLock);

    tryLock();
  });
}

function freeMutex(key) {
  return redis.del(key)
    .then(function () {
      redis.publish('mutex-unlock', key);
      return;
    });
}

function runWithMutex(key, cb) {
  var result = getMutex(key).then(cb);
  return result.then(function () {
    return freeMutex(key)
      .then(function () {
        return result;
      });
  });
}

module.exports = {
  getMutex: getMutex,
  freeMutex: freeMutex,
  runWithMutex: runWithMutex
};
