// Escher's per-task limit only bounds its search; this bounds a whole request as seen from the page,
// including Worker startup, WASM loading, every task and whole-method validation.
export const DEFAULT_REQUEST_TIMEOUT_MS = 60000;

export const createRefsynClient = (createWorker, { requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS } = {}) => {
    let nextRequestId = 1;
    let worker = null;
    const pending = new Map();

    // A failed or stuck Worker serves no later request, so it is dropped and every waiting request fails.
    const discardWorker = (message) => {
        const failed = worker;
        worker = null;
        if (failed) {
            failed.terminate();
        }
        const callbacks = [...pending.values()];
        pending.clear();
        for (const callback of callbacks) {
            clearTimeout(callback.timer);
            callback.reject(new Error(message));
        }
    };

    const getWorker = () => {
        if (worker) {
            return worker;
        }

        const created = createWorker();
        created.addEventListener("message", (event) => {
            const callback = pending.get(event.data?.id);
            if (!callback) {
                return;
            }

            pending.delete(event.data.id);
            clearTimeout(callback.timer);
            if (event.data.ok) {
                callback.resolve(event.data.response);
                return;
            }

            callback.reject(new Error(event.data.error));
        });
        // A Worker script that cannot be loaded (e.g. a chunk removed by a redeploy) reports only this event.
        created.addEventListener("error", (event) => {
            if (created === worker) {
                discardWorker(`RefSyn worker failed: ${event?.message || "it could not be loaded or crashed"}`);
            }
        });
        created.addEventListener("messageerror", () => {
            if (created === worker) {
                discardWorker("RefSyn worker sent a message that could not be read");
            }
        });
        worker = created;
        return worker;
    };

    return (request, options = {}) => new Promise((resolve, reject) => {
        let target;
        try {
            target = getWorker();
        } catch (error) {
            reject(error);
            return;
        }
        const id = nextRequestId++;
        const timer = setTimeout(() => {
            if (pending.has(id)) {
                discardWorker(`RefSyn synthesis did not finish within ${requestTimeoutMs} ms`);
            }
        }, requestTimeoutMs);
        pending.set(id, { resolve, reject, timer });
        try {
            target.postMessage({ id, request, options });
        } catch (error) {
            pending.delete(id);
            clearTimeout(timer);
            reject(error);
        }
    });
};
