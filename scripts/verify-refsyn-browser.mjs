import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const refsynDir = process.env.REFSYN_DIR
  ? resolve(process.env.REFSYN_DIR)
  : resolve(rootDir, "..");

const fixturePath = resolve(rootDir, "json/refsyn-append-request.json");
const wasmJsPath = resolve(refsynDir, "web/pkg/refsyn.js");
const wasmPath = resolve(refsynDir, "web/pkg/refsyn_bg.wasm");
const adapterPath = resolve(refsynDir, "runtime/refsyn-escher-adapter.mjs");

const request = JSON.parse(await readFile(fixturePath, "utf8"));
const wasm = await import(pathToFileURL(wasmJsPath).href);
const wasmBytes = await readFile(wasmPath);
wasm.initSync({ module: wasmBytes });

const rawArtifacts = wasm.synthesize_browser(
  JSON.stringify(request),
  JSON.stringify({ trace: false }),
);
const artifacts = JSON.parse(rawArtifacts);
const response = JSON.parse(JSON.stringify(artifacts.response));

if (artifacts.task_json) {
  const { applyRefsynTaskOutcomes, runRefsynTasks } = await import(pathToFileURL(adapterPath).href);
  const tasks = JSON.parse(artifacts.task_json);
  const outcomes = runRefsynTasks(tasks, {
    quiet: true,
    maxCost: 20,
    timeoutMs: 2000,
    searchSizeFactor: 3,
  });

  response.code = Array.isArray(response.code) ? response.code : [];
  response.individual_codes = Array.isArray(response.individual_codes) ? response.individual_codes : [];
  applyRefsynTaskOutcomes(response, outcomes);
}

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

assert(typeof response.common_pattern === "string" && response.common_pattern.length > 0, "common_pattern is missing");
assert(
  typeof response.composed_method_code === "string" && response.composed_method_code.length > 0,
  "composed_method_code is missing",
);
assert(Array.isArray(response.individual_codes) && response.individual_codes.length > 0, "individual_codes is empty");
assert(Array.isArray(response.escher_results) && response.escher_results.length > 0, "escher_results is empty");

console.log(JSON.stringify({
  common_pattern: response.common_pattern,
  composed_method_code: response.composed_method_code,
  individual_codes: response.individual_codes,
  escher_results: response.escher_results,
}, null, 2));
