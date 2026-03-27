let nextRequestId = 1;
let sharedWorker = null;
const pending = new Map();

const getWorker = () => {
    if (sharedWorker) {
        return sharedWorker;
    }

    sharedWorker = new Worker(new URL("./worker.js", import.meta.url));
    sharedWorker.addEventListener("message", (event) => {
        const callback = pending.get(event.data.id);
        if (!callback) {
            return;
        }

        pending.delete(event.data.id);
        if (event.data.ok) {
            callback.resolve(event.data.response);
            return;
        }

        callback.reject(new Error(event.data.error));
    });
    return sharedWorker;
};

export const runRefsynBrowser = (request, options = {}) => {
    const worker = getWorker();
    const requestId = nextRequestId++;

    return new Promise((resolve, reject) => {
        pending.set(requestId, { resolve, reject });
        worker.postMessage({
            id: requestId,
            request,
            options
        });
    });
};

if (typeof globalThis !== "undefined") {
    globalThis.runRefsynBrowser = runRefsynBrowser;
    if (globalThis.__$__ && globalThis.__$__.Testize) {
        globalThis.__$__.Testize.runRefsynBrowser = runRefsynBrowser;
    }
}
