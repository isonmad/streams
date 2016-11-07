'use strict';

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
}

const error1 = new Error('a unique string');
error1.name = 'error1';

test(() => {
  assert_throws(error1, () => {
    new WritableStream({}, {
      get size() {
        throw error1;
      },
      highWaterMark: 5
    });
  }, 'construction should re-throw the error');
}, 'Writable stream: throwing strategy.size getter');

promise_test(t => {
  const ws = new WritableStream({}, {
    size() {
      throw error1;
    },
    highWaterMark: 5
  });

  const writer = ws.getWriter();

  const p1 = promise_rejects(t, error1, writer.write('a'), 'write should reject with the thrown error');

  const p2 = promise_rejects(t, error1, writer.closed, 'closed should reject with the thrown error');

  return Promise.all([p1, p2]);
}, 'Writable stream: throwing strategy.size method');

promise_test(t => {
  const sizes = [NaN, -Infinity, Infinity, -1];
  return Promise.all(sizes.map(size => {
    let theError;
    const ws = new WritableStream({}, {
      size() {
        return size;
      },
      highWaterMark: 5
    });

    const writer = ws.getWriter();

    return Promise.all([
      promise_rejects(t, new RangeError(), writer.write('a').catch(r => {
        theError = r;
        throw r;
      }), `write should reject with a RangeError for ${size}`),
      promise_rejects(t, new RangeError(), writer.closed.catch(e => {
        assert_equals(e, theError, `closed should reject with the error for ${size}`);
        throw e;
      }), 'closed should reject')]);
  }));
}, 'Writable stream: invalid strategy.size return value');

test(() => {
  assert_throws(error1, () => {
    new WritableStream({}, {
      size() {
        return 1;
      },
      get highWaterMark() {
        throw error1;
      }
    });
  }, 'construction should re-throw the error');
}, 'Writable stream: throwing strategy.highWaterMark getter');

test(() => {

  for (const highWaterMark of [-1, -Infinity, NaN, 'foo', {}]) {
    assert_throws(new RangeError(), () => {
      new WritableStream({}, {
        size() {
          return 1;
        },
        highWaterMark
      });
    }, `construction should throw a RangeError for ${highWaterMark}`);
  }
}, 'Writable stream: invalid strategy.highWaterMark');

test(() => {
  assert_throws(new TypeError(), () => {
    new WritableStream({}, { size: 'a string' });
  });
}, 'reject any non-function value for strategy.size');

done();