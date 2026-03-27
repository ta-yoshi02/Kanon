import init, { synthesize_browser } from "@refsyn/wasm";
import { handleSynthesisMessage } from "./browser-runner.js";

let wasmInit = null;

const ensureWasm = async () => {
    if (!wasmInit) {
        wasmInit = init().then(() => undefined);
    }

    await wasmInit;
};

const runCore = async (request, options) => {
    await ensureWasm();
    const raw = synthesize_browser(
        JSON.stringify(request),
        JSON.stringify({
            trace: options.trace ?? false
        }),
    );
    return JSON.parse(raw);
};

self.addEventListener("message", async (event) => {
    const { id, request, options = {} } = event.data;
    try {
        const response = await handleSynthesisMessage(runCore, request, options);
        self.postMessage({ id, ok: true, response });
    } catch (error) {
        self.postMessage({
            id,
            ok: false,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
