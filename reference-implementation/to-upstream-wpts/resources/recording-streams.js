"use strict";

self.recordingReadableStream = (extras = {}) => {
  const stream = new ReadableStream({
    start: extras.start,
    pull(controller) {
      stream.events.push('pull');

      if (extras.pull) {
        return extras.pull(controller);
      }
    },
    cancel(reason) {
      stream.events.push('cancel', reason);

      if (extras.cancel) {
        return extras.cancel(reason);
      }
    }
  });

  stream.events = [];

  return stream;
};

self.recordingWritableStream = (extras = {}) => {
  const stream = new WritableStream({
    start: extras.start,
    write(chunk) {
      stream.events.push('write', chunk);

      if (extras.write) {
        return extras.write(chunk);
      }
    },
    close() {
      stream.events.push('close');

      if (extras.close) {
        return extras.close();
      }
    },
    abort(e) {
      stream.events.push('abort', e);

      if (extras.abort) {
        return extras.abort(e);
      }
    }
  });

  stream.events = [];

  return stream;
};
