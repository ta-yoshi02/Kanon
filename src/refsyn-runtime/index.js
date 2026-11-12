import { createRefsynClient } from "./client.js";

export const runRefsynBrowser = createRefsynClient(() => new Worker(new URL("./worker.js", import.meta.url)));

if (typeof globalThis !== "undefined") {
    globalThis.runRefsynBrowser = runRefsynBrowser;
    if (globalThis.__$__ && globalThis.__$__.Testize) {
        globalThis.__$__.Testize.runRefsynBrowser = runRefsynBrowser;
    }
}
