'use strict';

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
  self.importScripts('../resources/recording-streams.js');
}

const error1 = new Error('error1!');
error1.name = 'error1';

const error2 = new Error('error2!');
error2.name = 'error2';

promise_test(t => {

  const rs = recordingReadableStream({
    start() {
      return Promise.reject(error1);
    }
  });

  const ws = recordingWritableStream();

  return promise_rejects(t, { name: 'error1' }, rs.pipeTo(ws), 'pipeTo must reject with the same error')
    .then(() => {
      assert_array_equals(rs.events, []);
      assert_array_equals(ws.events, ['abort', error1]);
    });

}, 'Errors must be propagated forward: starts errored; preventAbort = false; fulfilled abort promise');

promise_test(t => {

  const rs = recordingReadableStream({
    start() {
      return Promise.reject(error1);
    }
  });

  const ws = recordingWritableStream({
    abort() {
      throw error2;
    }
  });

  return promise_rejects(t, { name: 'error2' }, rs.pipeTo(ws), 'pipeTo must reject with the abort error')
    .then(() => {
      assert_array_equals(rs.events, []);
      assert_array_equals(ws.events, ['abort', error1]);
    });

}, 'Errors must be propagated forward: starts errored; preventAbort = false; rejected abort promise');

promise_test(t => {

  const rs = recordingReadableStream({
    start() {
      return Promise.reject(error1);
    }
  });

  const ws = recordingWritableStream();

  return promise_rejects(t, { name: 'error1' }, rs.pipeTo(ws, { preventAbort: true }),
    'pipeTo must reject with the same error')
    .then(() => {
      assert_array_equals(rs.events, []);
      assert_array_equals(ws.events, []);
    });

}, 'Errors must be propagated forward: starts errored; preventAbort = true');

promise_test(t => {

  const rs = recordingReadableStream();

  const ws = recordingWritableStream({
    start() {
      return Promise.reject(error1);
    }
  });

  return promise_rejects(t, { name: 'error1' }, rs.pipeTo(ws), 'pipeTo must reject with the same error')
    .then(() => {
      assert_array_equals(rs.eventsWithoutPulls, ['cancel', error1]);
      assert_array_equals(ws.events, []);
    });

}, 'Errors must be propagated backward: starts errored; preventCancel = false; fulfilled cancel promise');

promise_test(t => {

  const rs = recordingReadableStream({
    cancel() {
      throw error2;
    }
  });

  const ws = recordingWritableStream({
    start() {
      return Promise.reject(error1);
    }
  });

  return promise_rejects(t, { name: 'error2' }, rs.pipeTo(ws), 'pipeTo must reject with the cancel error')
    .then(() => {
      assert_array_equals(rs.eventsWithoutPulls, ['cancel', error1]);
      assert_array_equals(ws.events, []);
    });

}, 'Errors must be propagated backward: starts errored; preventCancel = false; rejected cancel promise');

promise_test(t => {

  const rs = recordingReadableStream();

  const ws = recordingWritableStream({
    start() {
      return Promise.reject(error1);
    }
  });

  return promise_rejects(t, { name: 'error1' }, rs.pipeTo(ws, { preventCancel: true }), 'pipeTo must reject with the same error')
    .then(() => {
      assert_array_equals(rs.eventsWithoutPulls, []);
      assert_array_equals(ws.events, []);
    });

}, 'Errors must be propagated backward: starts errored; preventCancel = true');
