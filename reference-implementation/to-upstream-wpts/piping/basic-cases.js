'use strict';

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
}

test(() => {

  const rs = new ReadableStream();
  const ws = new WritableStream();

  assert_false(rs.locked, 'sanity check: the readable stream must not start locked');
  assert_false(ws.locked, 'sanity check: the writable stream must not start locked');

  rs.pipeTo(ws);

  assert_true(rs.locked, 'the readable stream must become locked');
  assert_true(ws.locked, 'the writable stream must become locked');

}, 'Piping must lock both the readable and writable streams');

promise_test(() => {

  const rs = new ReadableStream({
    start(controller) {
      controller.close();
    }
  });
  const ws = new WritableStream();

  return rs.pipeTo(ws).then(() => {
    assert_false(rs.locked, 'the readable stream must become unlocked');
    assert_false(ws.locked, 'the writable stream must become unlocked');
  });

}, 'Piping finishing must unlock both the readable and writable streams');

promise_test(() => {

  const CHUNKS = 1000;

  const rs = new ReadableStream({
    start(c) {
      for (let i = 0; i < CHUNKS; ++i) {
        c.enqueue(i);
      }
      c.close();
    }
  });

  const written = [];
  const ws = new WritableStream({
    write(chunk) {
      written.push(chunk);
    },
    close() {
      written.push('closed');
    }
  }, new CountQueuingStrategy({ highWaterMark: CHUNKS }));

  return rs.pipeTo(ws).then(() => {
    const targetValues = [];
    for (let i = 0; i < CHUNKS; ++i) {
      targetValues.push(i);
    }
    targetValues.push('closed');

    assert_array_equals(written, targetValues, 'the correct values must be written');

    // Ensure both readable and writable are closed by the time the pipe finishes.
    return Promise.all([
      rs.getReader().closed,
      ws.getWriter().closed
    ]);
  });

  // NOTE: no requirement on *when* the pipe finishes; that is left to implementations.

}, 'Piping from a ReadableStream from which lots of chunks are synchronously readable');
