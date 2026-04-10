const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const refsynDir = process.env.REFSYN_DIR
  ? path.resolve(process.env.REFSYN_DIR)
  : path.resolve(rootDir, "..");

const resolveRefsynPath = (...parts) => path.resolve(refsynDir, ...parts);

const requiredPaths = [
  resolveRefsynPath("web/pkg/refsyn.js"),
  resolveRefsynPath("web/pkg/refsyn_bg.wasm"),
  resolveRefsynPath("runtime/refsyn-escher-adapter.mjs"),
  resolveRefsynPath("external/escher-ts/dist/index.js"),
];

for (const requiredPath of requiredPaths) {
  if (!fs.existsSync(requiredPath)) {
    throw new Error(
      `Missing RefSyn build input: ${requiredPath}. Set REFSYN_DIR and run node ${resolveRefsynPath("web/scripts/build-wasm.mjs")}.`,
    );
  }
}

module.exports = {
  mode: "production",
  target: ["web", "es2020"],
  entry: path.resolve(rootDir, "src/refsyn-runtime/index.js"),

  output: {
    path: path.resolve(rootDir, "build/refsyn-runtime"),
    filename: "refsyn-browser-runtime.js",
    chunkFilename: "[name]-[contenthash].js",
    assetModuleFilename: "assets/[name]-[contenthash][ext][query]",
    publicPath: "auto",
    clean: true,
  },

  resolve: {
    alias: {
      "@refsyn/wasm": resolveRefsynPath("web/pkg/refsyn.js"),
      "@refsyn/escher-adapter": resolveRefsynPath("runtime/refsyn-escher-adapter.mjs"),
    },
  },

  performance: {
    hints: false,
  },
};
