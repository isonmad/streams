'use strict';

if (self.importScripts) {
  self.importScripts('/resources/testharness.js');
}

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

    assert_array_equals(written, targetValues, 'the correct values should be written');

    // Ensure both readable and writable are closed by the time the pipe finishes.
    return Promise.all([
      rs.getReader().closed,
      ws.getWriter().closed
    ]);
  });

  // NOTE: no requirement on *when* the pipe finishes; that is left to implementations.
}, 'Piping from a ReadableStream from which lots of chunks are synchronously readable');
