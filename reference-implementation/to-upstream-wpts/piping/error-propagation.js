'use strict';

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
}

promise_test(t => {

  const error = new Error('boo!');
  error.name = 'test error';

  const rs = new ReadableStream({
    start() {
      return Promise.reject(error);
    },
    pull() {
      assert_unreached('Unexpected pull call');
    }
  });

  let abortCalled = false;
  const ws = new WritableStream({
    write() {
      assert_unreached('Unexpected write call');
    },
    close() {
      assert_unreached('Unexpected close call');
    },
    abort(e) {
      assert_equals(e, error, 'the error passed to abort must be the same error');
      abortCalled = true;
    }
  });

  return promise_rejects(t, { name: 'test error' }, rs.pipeTo(ws), 'pipeTo must reject with the same error')
    .then(() => assert_true(abortCalled));

}, 'Errors must be propagated forward: starts errored; preventAbort = false; fulfilled abort promise');

promise_test(t => {

  const error1 = new Error('boo 1!');
  error1.name = 'test error 1';

  const error2 = new Error('boo 2!');
  error2.name = 'test error 2';

  const rs = new ReadableStream({
    start() {
      return Promise.reject(error1);
    },
    pull() {
      assert_unreached('Unexpected pull call');
    }
  });

  let abortCalled = false;
  const ws = new WritableStream({
    write() {
      assert_unreached('Unexpected write call');
    },
    close() {
      assert_unreached('Unexpected close call');
    },
    abort(e) {
      assert_equals(e, error1, 'the error passed to abort must be the same error');
      abortCalled = true;
      throw error2;
    }
  });

  return promise_rejects(t, { name: 'test error 2' }, rs.pipeTo(ws), 'pipeTo must reject with the abort error')
    .then(() => assert_true(abortCalled));

}, 'Errors must be propagated forward: starts errored; preventAbort = false; rejected abort promise');

promise_test(t => {

  const error = new Error('boo!');
  error.name = 'test error';

  const rs = new ReadableStream({
    start() {
      return Promise.reject(error);
    },
    pull() {
      assert_unreached('Unexpected pull call');
    }
  });

  const ws = new WritableStream({
    write() {
      assert_unreached('Unexpected write call');
    },
    close() {
      assert_unreached('Unexpected close call');
    },
    abort(e) {
      assert_unreached('Unexpected abort call');
    }
  });

  return promise_rejects(t, { name: 'test error' }, rs.pipeTo(ws, { preventAbort: true }),
    'pipeTo must reject with the same error');

}, 'Errors must be propagated forward: starts errored; preventAbort = true');
