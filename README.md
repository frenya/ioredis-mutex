# ioredis-mutex

Redis based mutex implementation. Uses pub/sub for mutex retries instead of timeouts.

# Installation

```
$ npm install ioredis-mutex --save
```

# Usage

```javascript
var runWithMutex = require('ioredis-mutex').runWithMutex;

function asyncFunc(retval, delay) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve(retval);
    }, delay);
  });
}

// The two invocations of asyncFunc are guaranteed to not run in parallel
var x1 = runWithMutex('bazinga', function () { return asyncFunc(1, 1000); });
var x2 = runWithMutex('bazinga', function () { return asyncFunc(2, 1000); });
```

# Notes

The connection to Redis uses the `REDIS_URL` environment variable
as a connection string (when available).
