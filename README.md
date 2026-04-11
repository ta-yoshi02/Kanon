# Kanon

__Kanon__ is a live programming environment for data structures.
While you write JavaScript code in the editor on the left-hand side,
the data structures constructed during the execution of the code appears as a graph on the right-hand side.

![](./example.gif)

## How to use

Kanon runs on your browser. Open the following page: [https://ta-yoshi02.github.io/Kanon/](https://ta-yoshi02.github.io/Kanon/).

## How to build

To build __Kanon__ in your local environment,
execute the following command.
```
git clone https://github.com/prg-titech/Kanon.git
```
This will copy the source code of Kanon.
After downloaded, go to the Kanon directory and execute the following command.

```
npm install
```

Then, execute the following command and open http://localhost:8000/ to view the application.

```
npm start
```

(You can change the port by using `npm start -- --port=8001`).

### GitHub Pages Build

Production deploys are built in this repository and published to GitHub Pages by [`.github/workflows/pages.yml`](./.github/workflows/pages.yml).

- `Kanon` remains the deploy owner.
- `RefSyn` is checked out only during the build job from `ta-yoshi02/RefSyn@main`.
- `escher-ts` is checked out during the build job from `ta-yoshi02/escher-ts@main`.
- the public site bundles a browser-only `wasm + Web Worker + escher-ts` runtime
- non-local hosts do not fall back to `http://localhost:3030/synthesize`
- the workflow summary records the exact resolved SHAs used for the deploy

To build the same Pages artifact locally, prepare a sibling `RefSyn` checkout and run:

```sh
npm install
node ../RefSyn/web/scripts/build-wasm.mjs
REFSYN_DIR=../RefSyn npm run build-refsyn-runtime
REFSYN_DIR=../RefSyn npm run verify-refsyn-browser
npm run build-pages
python3 -m http.server 8000 --directory dist
```

The generated static artifact is written to `dist/`. The Pages build injects `src/js/vendor/refsyn-browser-runtime.js` into `dist/index.html`, so synthesis runs in-browser on `/Kanon/` without any backend server.

Latest-head verification is handled separately by [`.github/workflows/verify-latest.yml`](./.github/workflows/verify-latest.yml). That workflow builds the browser runtime from `Kanon@master`, `RefSyn@main`, and `escher-ts@main`, records the resolved SHAs, and stops after build/verification without deploying Pages.

### Desptop Application

You can also use __Kanon__ by desktop application.

```
npm run-script app
```

## Samples

it is recommended that you try to use sample code that is in [samples](https://github.com/prg-titech/Kanon/tree/master/samples) directory if you have never used Kanon.

---

## Notes

__Kanon__ uses the following libraries.

- [vis.js](http://visjs.org) (https://github.com/almende/vis)

- [Ace](https://ace.c9.io) (https://github.com/ajaxorg/ace)

- [esprima](http://esprima.org) (https://github.com/jquery/esprima/tree/3.1.1)
  [*]

- escodegen (https://github.com/estools/escodegen)

- [jQuery](https://jquery.com/) (https://github.com/jquery/jquery)

- [jQuery UI](https://jqueryui.com/) (https://github.com/jquery/jquery-ui) 


## References

- Live Editor (https://github.com/Khan/live-editor)

## LICENSE

Kanon is distributed under the MIT License. See [LICENSE](https://github.com/prg-titech/Kanon/blob/master/LICENSE) for more information.

[*]: Our repository includes esprima.js in the externals directory, which is taken from https://unpkg.com/esprima@3.1.1/dist/esprima.js .
