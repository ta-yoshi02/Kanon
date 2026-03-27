import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const distDir = resolve(rootDir, "dist");
const runtimeBuildDir = resolve(rootDir, "build/refsyn-runtime");
const runtimeDistDir = resolve(distDir, "src/js/vendor");

const frontendPackages = [
  "ace-builds",
  "d3",
  "esprima",
  "jquery",
  "jquery-ui-dist",
  "split-pane",
  "vis",
];

const copyRecursive = async (from, to) => {
  await mkdir(dirname(to), { recursive: true });
  await cp(from, to, {
    recursive: true,
    force: true,
  });
};

const injectRuntimeScript = (html) => {
  const tag = '\n\t<script type="text/javascript" src="src/js/vendor/refsyn-browser-runtime.js"></script>';
  if (html.includes("refsyn-browser-runtime.js")) {
    return html;
  }
  if (html.includes("</body>")) {
    return html.replace("</body>", `${tag}\n</body>`);
  }
  return `${html}${tag}\n`;
};

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

let indexHtml = await readFile(resolve(rootDir, "index.html"), "utf8");

if (existsSync(runtimeBuildDir)) {
  indexHtml = injectRuntimeScript(indexHtml);
  await copyRecursive(runtimeBuildDir, runtimeDistDir);
}

await writeFile(resolve(distDir, "index.html"), indexHtml);

for (const relativePath of ["src", "examples", "json"]) {
  await copyRecursive(resolve(rootDir, relativePath), resolve(distDir, relativePath));
}

await copyRecursive(
  resolve(rootDir, "external/escodegen"),
  resolve(distDir, "external/escodegen"),
);

for (const packageName of frontendPackages) {
  await copyRecursive(
    resolve(rootDir, "node_modules", packageName),
    resolve(distDir, "node_modules", packageName),
  );
}

await writeFile(resolve(distDir, ".nojekyll"), "");
