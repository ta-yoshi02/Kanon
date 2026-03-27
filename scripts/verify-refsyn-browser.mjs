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
const escherPath = resolve(refsynDir, "external/escher-ts/dist/refsyn.js");

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
  const { runRefsynTasks } = await import(pathToFileURL(escherPath).href);
  const tasks = JSON.parse(artifacts.task_json);
  const outcomes = runRefsynTasks(tasks, {
    quiet: true,
    maxCost: 20,
    timeoutMs: 2000,
    searchSizeFactor: 3,
  });

  const existing = Array.isArray(response.escher_results) ? response.escher_results : [];
  response.escher_results = existing.slice();
  response.code = Array.isArray(response.code) ? response.code : [];
  response.individual_codes = Array.isArray(response.individual_codes) ? response.individual_codes : [];

  for (const outcome of outcomes) {
    response.escher_results.push({
      name: outcome.name,
      success: outcome.success,
      rendered: outcome.rendered,
      error: outcome.error,
    });

    if (typeof outcome.compiled_js === "string" && outcome.compiled_js.length > 0) {
      response.code.push(outcome.compiled_js);
      response.individual_codes.push(`${outcome.name}: ${outcome.compiled_js}`);
      continue;
    }

    if (typeof outcome.error === "string" && outcome.error.length > 0) {
      response.individual_codes.push(`${outcome.name}: ERROR ${outcome.error}`);
      continue;
    }

    if (typeof outcome.rendered === "string" && outcome.rendered.length > 0) {
      response.individual_codes.push(
        `${outcome.name}: ERROR compiled_js missing for rendered term ${outcome.rendered}`,
      );
      continue;
    }

    response.individual_codes.push(`${outcome.name}: no output`);
  }
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
