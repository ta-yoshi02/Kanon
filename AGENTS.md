# Repository Guidelines

## Project Structure & Module Organization
- `src/js` holds the core visualization and instrumentation logic; subfolders like `object2graph/` and `code-instrumentation/` map 1:1 to major features.
- `src/jsx` contains React-based UI elements (e.g. `menubar/`) that are bundled via Babel; keep component-specific assets co-located.
- `src/css` defines layout and theme styles, while `examples/` and `json/` provide runnable samples and configuration presets used by the in-app loader.
- Vendored libraries live in `external/`; avoid modifying them directly. Electron entry points (`app.js`, `index.html`, `webpack.config.js`, `Gruntfile.js`) stay at repo root.
- Tests reside in `src/js/test`, with fixture programs under `user-code/` for regression coverage.

## Build, Test, and Development Commands
- `npm install` installs dependencies and initializes submodules (`preinstall` hook).
- `npm start` runs `grunt serve` for the browser IDE at `http://localhost:8000/`; use `npm start -- --port=9000` to change port.
- `npm test` executes the Jest suite.
- `npm run build-menu` rebuilds bundled menu assets via webpack; invoke before committing React menu changes.
- `npm run app` launches the Electron desktop build; `npm run create` produces a distributable macOS package.

## Coding Style & Naming Conventions
- Use ES6 syntax where possible; legacy globals remain but prefer module-scoped helpers and `const`/`let`.
- Follow 4-space indentation, single quotes in JavaScript, and camelCase for functions/variables. React components stay in PascalCase and live under matching filenames (`SelectSample.jsx`).
- Keep side-effect imports grouped atop each file; document non-obvious flows with concise comments.
- When touching CSS, scope rules with component-specific classes to avoid bleeding into the graph canvas.
- 実装前に既存の類似機能を確認する
- 既存プログラムを踏襲する
- Think in English and answer in Japanese.

## Testing Guidelines
- Place new tests beside the code under `src/js/test`, using `*.test.js` to stay on Jest’s default pattern.
- Stub user programs via `user-code/` fixtures rather than inline strings. Prefer deterministic graph expectations over screenshots.
- Run `npm test -- --watch` during development; include coverage-sensitive cases for new traversal, layout, or instrumentation logic.

## Commit & Pull Request Guidelines
- History favors short, imperative commits (e.g. `fix syntax error`, `increase message area height`); keep subject lines <= 72 chars and reference modules when helpful.
- Squash WIP commits locally. Ensure each commit passes `npm test` and `npm start` smoke checks.
- Pull requests should summarize motivation, list manual verification steps, link tickets, and attach UI captures when altering canvas appearance or menus.
