# firebase-functions-smart-export

[![CI](https://github.com/mjphooper/firebase-functions-smart-export/actions/workflows/ci.yml/badge.svg)](https://github.com/mjphooper/firebase-functions-smart-export/actions/workflows/ci.yml)

Firebase Functions Smart Export (FFSE) is a dynamic function exporter that streamlines function exporting and aims to improve cold start times. FFSE is a [pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

> **Status:** This package is primarily maintained as internal tooling and a portfolio piece. If you're looking for a more battle-tested option, [better-firebase-functions](https://www.npmjs.com/package/better-firebase-functions) now supports ESM via `exportFunctionsAsync` and is likely the right choice for most projects. See [Comparison](#comparison) below.

## Highlights

- ✨ **Zero-boilerplate exports** — Functions are automatically discovered, grouped, and exported based on file structure.
- ⚡ **Faster cold starts** — Only the dependencies of the invoked function are loaded at runtime, rather than your entire codebase.
- 🛠️ **Build-time codegen** — A static function map is written to disk; no runtime filesystem scanning.
- 📦 **ESM native** — Built from the ground up for modern ES modules.

## Motivation

Cold starts in Firebase Functions can be slow. By default, Node loads your entire codebase before executing any function — even dependencies that aren't needed.

The Firebase team [recommends lazy-loading](https://youtu.be/v3eG9xpzNXM) function implementations using dynamic `import()` to load only what's needed at runtime. This works well for small projects, but manually wiring up lazy exports becomes a real pain as projects grow in size and complexity.

[better-firebase-functions](https://www.npmjs.com/package/better-firebase-functions) ([explainer article](https://medium.com/swlh/a-toolkit-to-speed-up-and-optimise-firebase-cloud-functions-part-1-6f74f278660c)) was the original solution. When FFSE was first written, that package only supported CommonJS, so FFSE was built to bring the same benefits to ESM. BFF has since added `exportFunctionsAsync` for ESM, so the gap that originally motivated FFSE no longer exists.

FFSE takes a different architectural approach: instead of globbing the filesystem at every cold start, it generates a static function map at build time. That tradeoff is the only meaningful difference between the two packages today.

<a name="comparison"></a>
## How FFSE differs from better-firebase-functions

|                          | FFSE                                | better-firebase-functions (ESM)        |
|--------------------------|-------------------------------------|----------------------------------------|
| Function discovery       | Build-time codegen (`npx ffse`)     | Runtime filesystem glob                |
| Build step required      | Yes (or hooked into existing build) | No                                     |
| Function map             | Static, diffable in `index.gen.js`  | Built from glob on every cold start    |
| Cold-start I/O           | None for discovery                  | One `fast-glob` scan per cold start    |
| Runtime dependencies     | None                                | `fast-glob`                            |

If you already run a build step before deploy (TypeScript compile, bundling, or `firebase.json`'s `predeploy` hook), wiring `ffse` into `prebuild` makes the codegen invisible — you run `firebase deploy` like you always did. In return, you get a static function map and zero runtime filesystem scanning.

If you'd rather not have a build step at all, use BFF.

## Quick start

1.  Install the package via NPM.
```bash
npm install firebase-functions-smart-export
```

2. Ensure your functions are the default exports of files with the `.function.js` (or `.ts`) extension. For more information, see [Exporting functions](#exporting-functions).
```javascript
// some/path/my_function_name.function.js
import { onCall } from 'firebase-functions/v2/https';

export default onCall({...});
```

3. Run the CLI tool (and every time you modify your functions) to generate your exports.
```bash
npx ffse
```
> Consider adding `cd path/to/functions && npx ffse` to the "functions" pre-deployment script in `firebase.json` to automate this process.


4. Replace the contents of your `lib/index.js` (or `src/index.ts`) with:
```javascript
export * from './index.gen.js';
```

5. You can now deploy your functions as normal!
```bash
firebase deploy --only functions
```


## How it works
  
🔍   **1.** At build time, the CLI searches your source directory for files matching `**/*.function.js` or `**/*.function.ts` (the `function` part is configurable via `matchExtension`). Each file's default export becomes a function, named after its path. To learn more, see [Exporting functions](#exporting-functions).

🛠️ **2.**  An `index.gen.js` file is generated in your source directory (auto-detected or configured via `sourceDir`). It contains a literal `import()` for every function, relative to the generated file, and nests them into named exports matching your function groups. It has no dependency on this package at runtime.

⚡️**3.**  At runtime, `index.gen.js` checks which function the instance is serving (via `FUNCTION_TARGET` or `K_SERVICE`). Only that function's module is imported, avoiding the overhead of loading unused dependencies. When no target is set (e.g. during deploy discovery), every function is imported in parallel. If the target isn't in the generated file, it throws an error asking you to rerun `ffse`.
  
<a name="exporting-functions"></a> 
## Exporting functions

### Use `default export`

In order for FFSE to name and access your functions, they must all be the default export of their own module. As a result, each of your functions requires its own file. However, this is probably a good thing, and isolating your functions is what allows dynamic importing to reduce cold start times.

<a name="function-names"></a>
### How names are determined
Your exported functions are [grouped](https://firebase.google.com/docs/functions/organize-functions?gen=2nd#group_functions) and named according to their file name and relative path. The best way to illustrate this is through an example:

📁 `/lib/posts/https/create_post.function.js` (supports **snake_case** or **kebab-case**)
✅ `posts-https-createPost`

Where "posts" and "https" are the function groups and "createPost" is the function name. Notice that `lib/` is not included as a group as the root directory likely contains no semantic value.


### Further customization
FFSE provides multiple ways of customizing how groups are generated from file paths. See the [Configuration](#config) section below to learn more.

<a name="config"></a>
## Configuration
You can provide a `ffse.config.js` file in your project's root directory to configure the behavior of the build tool. You can use the public `defineConfig` function to assist in structuring your config.
```javascript
// ./ffse.config.js
import { defineConfig } from 'firebase-functions-smart-export';

export default defineConfig({...});
```
Possible configuration fields are:
- `sourceDir`: The directory containing your function source files, relative to the project root. For TypeScript projects, this is typically `'src'`. For JavaScript projects, this is typically `'lib'`. If not specified, FFSE will auto-detect by checking for `src/` first, then `lib/`.
- `matchExtension`: The file extension used to identify the files containing your functions. This defaults to `"function"`.
- `ignoreGroups`: A list of groups to exclude from the final function name. This can be used to remove path segments with no semantic value from the exported function name.
- `maxGroupDepth`: Limits the number of groups in function names.
- `disableGroups`: Removes groups entirely from function names.
- `mapGroups`: Custom mapper that allows you to apply any transformation to the list of groups proposed for a given function.
- `useSingleQuotes`: Whether to use single quotes `'` (instead of double) in the generated code. Alternatively, you can add `index.gen.js` as an exception in your linter config.

### Example: Custom source directory
If your function sources live somewhere other than `src/` or `lib/`:
```javascript
// ./ffse.config.js
import { defineConfig } from 'firebase-functions-smart-export';

export default defineConfig({
  sourceDir: 'app',
});
```

## TypeScript and ESM
FFSE ships with TypeScript definitions and works straight out of the box in TypeScript projects. By default, FFSE uses `src/` as the source directory; configure `sourceDir` in your `ffse.config.js` if yours differs. The compiled output can live anywhere, as `index.gen.js` imports your functions relative to itself.

`index.gen.js` is a JavaScript file written into your source directory, so set `allowJs: true` in your `tsconfig.json` for `tsc` to copy it into your output directory.


## Limitations
- FFSE assumes that your output directory mirrors your source directory's structure after compilation, since `index.gen.js` imports each function by its path relative to itself. This is the default behavior of TypeScript and most build tools.

## Troubleshooting

### Emulator crash on Node 20.19+ / Node 22+

If the Firebase emulator crashes with `ERR_REQUIRE_ASYNC_MODULE` when loading your functions, this is a [known bug](https://github.com/firebase/firebase-tools/issues/8589) in `firebase-tools`. The emulator tries to `require()` your ESM entry point and doesn't handle the error thrown when the module contains top-level `await`.

A [fix](https://github.com/firebase/firebase-tools/pull/8394) is pending in `firebase-tools`. Until it ships, start the emulator with:

```bash
NODE_OPTIONS="--no-experimental-require-module" firebase emulators:start
```

This disables Node's `require(ESM)` feature, restoring the previous behavior where the emulator falls back to dynamic `import()`.


<a name="contributing"></a>
## Contributing

This project would love contributions! Please feel free to open an issue or submit a PR. This project uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) so please be sure to follow the spec when making PRs!


## License
MIT