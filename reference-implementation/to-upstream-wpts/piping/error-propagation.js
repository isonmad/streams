'use strict';

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
  self.importScripts('../resources/recording-streams.js');
}

promise_test(t => {

  const error = new Error('boo!');
  error.name = 'test error';

  const rs = recordingReadableStream({
    start() {
      return Promise.reject(error);
    }
  });

  const ws = recordingWritableStream();

  return promise_rejects(t, { name: 'test error' }, rs.pipeTo(ws), 'pipeTo must reject with the same error')
    .then(() => {
      assert_array_equals(rs.events, []);
      assert_array_equals(ws.events, ['abort', error]);
    });

}, 'Errors must be propagated forward: starts errored; preventAbort = false; fulfilled abort promise');

promise_test(t => {

  const error1 = new Error('boo 1!');
  error1.name = 'test error 1';

  const error2 = new Error('boo 2!');
  error2.name = 'test error 2';

  const rs = recordingReadableStream({
    start() {
      return Promise.reject(error1);
    }
  });

  const ws = recordingWritableStream({
    abort(e) {
      throw error2;
    }
  });

  return promise_rejects(t, { name: 'test error 2' }, rs.pipeTo(ws), 'pipeTo must reject with the abort error')
    .then(() => {
      assert_array_equals(rs.events, []);
      assert_array_equals(ws.events, ['abort', error1]);
    });

}, 'Errors must be propagated forward: starts errored; preventAbort = false; rejected abort promise');

promise_test(t => {

  const error = new Error('boo!');
  error.name = 'test error';

  const rs = recordingReadableStream({
    start() {
      return Promise.reject(error);
    }
  });

  const ws = recordingWritableStream();

  return promise_rejects(t, { name: 'test error' }, rs.pipeTo(ws, { preventAbort: true }),
    'pipeTo must reject with the same error')
    .then(() => {
      assert_array_equals(rs.events, []);
      assert_array_equals(ws.events, []);
    });

}, 'Errors must be propagated forward: starts errored; preventAbort = true');
