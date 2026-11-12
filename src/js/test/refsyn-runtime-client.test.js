import { createRefsynClient } from '../../refsyn-runtime/client.js';

// Stands in for the browser Worker: records posts and lets a test emit the events a real Worker emits.
class FakeWorker {
    constructor() {
        this.listeners = {};
        this.posted = [];
        this.terminated = false;
    }
    addEventListener(type, listener) {
        (this.listeners[type] ||= []).push(listener);
    }
    emit(type, event) {
        for (const listener of this.listeners[type] || []) listener(event);
    }
    postMessage(message) {
        this.posted.push(message);
    }
    terminate() {
        this.terminated = true;
    }
}

const settle = promise => promise.then(value => ({ value }), error => ({ error: error.message }));

let workers;
const start = (options) => {
    workers = [];
    return createRefsynClient(() => {
        const worker = new FakeWorker();
        workers.push(worker);
        return worker;
    }, options);
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('a reply resolves only the request it answers', async () => {
    const run = start({ requestTimeoutMs: 1000 });
    const first = settle(run({ n: 1 }));
    const second = settle(run({ n: 2 }));
    const [worker] = workers;
    expect(worker.posted.map(message => message.request.n)).toEqual([1, 2]);
    worker.emit('message', { data: { id: worker.posted[1].id, ok: true, response: 'two' } });
    worker.emit('message', { data: { id: worker.posted[0].id, ok: false, error: 'invalid request json' } });
    expect(await second).toEqual({ value: 'two' });
    expect(await first).toEqual({ error: 'invalid request json' });
    expect(workers).toHaveLength(1);
    jest.advanceTimersByTime(5000);
    expect(worker.terminated).toBe(false);
});

// Before the fix, a Worker that failed to load left every request pending forever.
test('a Worker that cannot be loaded fails the waiting requests and is replaced on the next request', async () => {
    const run = start({ requestTimeoutMs: 1000 });
    const first = settle(run({ n: 1 }));
    const second = settle(run({ n: 2 }));
    workers[0].emit('error', { message: '' });
    expect(await first).toEqual({ error: 'RefSyn worker failed: it could not be loaded or crashed' });
    expect(await second).toEqual({ error: 'RefSyn worker failed: it could not be loaded or crashed' });
    expect(workers[0].terminated).toBe(true);

    const third = settle(run({ n: 3 }));
    expect(workers).toHaveLength(2);
    workers[1].emit('message', { data: { id: workers[1].posted[0].id, ok: true, response: 'three' } });
    expect(await third).toEqual({ value: 'three' });
});

test('an unreadable message fails the waiting requests', async () => {
    const run = start({ requestTimeoutMs: 1000 });
    const pending = settle(run({ n: 1 }));
    workers[0].emit('messageerror', {});
    expect(await pending).toEqual({ error: 'RefSyn worker sent a message that could not be read' });
    expect(workers[0].terminated).toBe(true);
});

test('a request that does not finish in time terminates the Worker and fails what it was running', async () => {
    const run = start({ requestTimeoutMs: 1000 });
    const stuck = settle(run({ n: 1 }));
    jest.advanceTimersByTime(999);
    expect(workers[0].terminated).toBe(false);
    jest.advanceTimersByTime(1);
    expect(await stuck).toEqual({ error: 'RefSyn synthesis did not finish within 1000 ms' });
    expect(workers[0].terminated).toBe(true);

    // A late reply from the terminated Worker is ignored, and the next request uses a new Worker.
    workers[0].emit('message', { data: { id: workers[0].posted[0].id, ok: true, response: 'late' } });
    const next = settle(run({ n: 2 }));
    workers[1].emit('message', { data: { id: workers[1].posted[0].id, ok: true, response: 'fresh' } });
    expect(await next).toEqual({ value: 'fresh' });
});

test('an error from a Worker already replaced does not fail requests on its successor', async () => {
    const run = start({ requestTimeoutMs: 1000 });
    const first = settle(run({ n: 1 }));
    jest.advanceTimersByTime(1000);
    await first;
    const second = settle(run({ n: 2 }));
    workers[0].emit('error', { message: 'late failure' });
    workers[1].emit('message', { data: { id: workers[1].posted[0].id, ok: true, response: 'ok' } });
    expect(await second).toEqual({ value: 'ok' });
});

test('a Worker that cannot be constructed rejects the request', async () => {
    const run = createRefsynClient(() => { throw new Error('Worker is not supported'); });
    expect(await settle(run({}))).toEqual({ error: 'Worker is not supported' });
});
