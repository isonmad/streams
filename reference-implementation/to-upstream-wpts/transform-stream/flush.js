'use strict';

if (self.importScripts) {
  self.importScripts('../resources/test-utils.js');
  self.importScripts('/resources/testharness.js');
}

promise_test(() => {
  let flushCalled = false;
  const ts = new TransformStream({
    transform() { },
    flush() {
      flushCalled = true;
    }
  });

  return ts.writable.getWriter().close().then(() => {
    return assert_true(flushCalled, 'closing the writable triggers the transform flush immediately');
  });
}, 'TransformStream flush is called immediately when the writable is closed, if no writes are queued');

// TODO
test(() => {
  let flushCalled = false;
  const ts = new TransformStream({
    transform() {
      return delay(10);
    },
    flush() {
      flushCalled = true;
      return new Promise(() => {}); // never resolves
    }
  });

  const writer = ts.writable.getWriter();
  writer.write('a');
  writer.close();
  assert_false(flushCalled, 'closing the writable does not immediately call flush if writes are not finished');

  let rsClosed = false;
  ts.readable.getReader().closed.then(() => {
    rsClosed = true;
  });

  return delay(50).then(() => {
    assert_true(flushCalled, 'flush is eventually called');
    assert_false(rsClosed, 'if flushPromise does not resolve, the readable does not become closed');
  });
}, 'TransformStream flush is called after all queued writes finish, once the writable is closed');

promise_test(() => {
  let c;
  const ts = new TransformStream({
    start(controller) {
      c = controller;
    },
    transform() {
    },
    flush() {
      c.enqueue('x');
      c.enqueue('y');
    }
  });

  const reader = ts.readable.getReader();

  const writer = ts.writable.getWriter();
  writer.write('a');
  writer.close();
  return reader.read().then(result1 => {
    assert_equals(result1.value, 'x', 'the first chunk read is the first one enqueued in flush');
    assert_equals(result1.done, false, 'the first chunk read is the first one enqueued in flush');

    return reader.read().then(result2 => {
      assert_equals(result2.value, 'y', 'the second chunk read is the second one enqueued in flush');
      assert_equals(result2.done, false, 'the second chunk read is the second one enqueued in flush');
    });
  });
}, 'TransformStream flush gets a chance to enqueue more into the readable');

promise_test(() => {
  let c;
  const ts = new TransformStream({
    start(controller) {
      c = controller;
    },
    transform() {
    },
    flush() {
      c.enqueue('x');
      c.enqueue('y');
      return delay(10);
    }
  });

  const reader = ts.readable.getReader();

  const writer = ts.writable.getWriter();
  writer.write('a');
  writer.close();

  return Promise.all([
    reader.read().then(result1 => {
      assert_equals(result1.value, 'x', 'the first chunk read is the first one enqueued in flush');
      assert_equals(result1.done, false, 'the first chunk read is the first one enqueued in flush');

      return reader.read().then(result2 => {
        assert_equals(result2.value, 'y', 'the second chunk read is the second one enqueued in flush');
        assert_equals(result2.done, false, 'the second chunk read is the second one enqueued in flush');
      });
    }),
    reader.closed.then(() => {
      assert_true(true, 'readable reader becomes closed');
    })
  ]);
}, 'TransformStream flush gets a chance to enqueue more into the readable, and can then async close');

done();
