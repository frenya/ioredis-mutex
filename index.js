'use strict';

var Promise = require('bluebird');
var Redis = require('ioredis');
var debug = require('debug')('ioredis-mutex');

var url = process.env.REDIS_URL;

// Connection used for setting and freeing locks and publishing unlock messages
var redis = url ? new Redis(url) : new Redis();

// Connection used for listening for unlock messages
var sub = url ? new Redis(url) : new Redis();

var subThreshold = 30;
var subTimeout = subThreshold * 1;

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

    function trySubscribe () {
      var numListeners = sub.listeners('message').length;
      // console.log('Number of listeners', numListeners);
      if (numListeners < subThreshold) {
        sub.on('message', retryLock);
        tryLock();
      }
      else {
        setTimeout(trySubscribe, subTimeout);
      }
    }

    trySubscribe();

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
