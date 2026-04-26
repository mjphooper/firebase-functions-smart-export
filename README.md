# firebase-functions-smart-export

  
Firebase Functions Smart Export (FFSE) is a dynamic function exporter that streamlines function exporting and aims to improve cold start times. FFSE is a [pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

## Highlights

- ✨ **Zero-boilerplate exports** — Functions are automatically discovered, grouped, and exported based on file structure.
- ⚡ **Faster cold starts** — Only the dependencies of the invoked function are loaded at runtime, rather than your entire codebase.
- 📦 **ESM native** — Built from the ground up for modern ES modules.

## Motivation

Cold starts in Firebase Functions can be slow. By default, Node loads your entire codebase before executing any function—even dependencies that aren't needed.

The Firebase team [recommends lazy-loading](https://youtu.be/v3eG9xpzNXM) function implementations using dynamic `import()` to load only what's needed at runtime. This works well for small projects, but manually wiring up lazy exports becomes a real pain as projects grow in size and complexity. 

A solution was provided by [better-firebase-functions](https://www.npmjs.com/package/better-firebase-functions), alongside this [excellent explanatory article](https://medium.com/swlh/a-toolkit-to-speed-up-and-optimise-firebase-cloud-functions-part-1-6f74f278660c). However, this package only supports CommonJS. FFSE was created to bring the same benefits to modern ESM projects.

ESM requires static exports at compile, unlike CommonJS which supports dynamic export via `await require(...)`. FFSE solves this with codegen, producing an index file with your exports pre-defined.

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


4. Replace the  contents of your `lib/index.js` (or `src/index.ts`) with:
```javascript
export * from './index.gen.js';
```

5. You can now deploy your functions as normal!
```bash
firebase deploy --only functions
```


## How it works
  
🔍   **1.** The CLI tool searches your project for files matching the default glob pattern `*.function` which exports  Firebase Functions with corresponding names. To learn more, see [Exporting functions](#exporting-functions).

🛠️ **2.**  An `index.gen.js` file is generated in your source directory (auto-detected or configured via `sourceDir`) that exports your functions in an ESM compatible manner.

⚡️**3.**  At runtime, FFSE dynamically discovers your function files and exports only the module required by the instance in which it is running, avoiding the overhead of loading unused dependencies.
  
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
import defineConfig from "firebase-functions-smart-export/cli/defineConfig";

export default defineConfig({...});
```
Possible configuration fields are:
- `sourceDir`: The directory containing your function source files, relative to the project root. For TypeScript projects, this is typically `'src'`. For JavaScript projects, this is typically `'lib'`. If not specified, FFSE will auto-detect by checking for `src/` first, then `lib/`.
- `outDir`: The directory containing compiled JavaScript files at runtime, relative to the project root. This is where the runtime will look for function modules to import. Defaults to `'lib'`.
- `matchExtension`: The file extension used to identify the files containing your functions. This defaults to `"function"`.
- `ignoreGroups`: A list of groups to exclude from the final function name. This can be used to remove path segments with no semantic value from the exported function name.
- `maxGroupDepth`: Limits the number of groups in function names.
- `disableGroups`: Removes groups entirely from function names.
- `mapGroups`: Custom mapper that allows you to apply any transformation to the list of groups proposed for a given function.
- `useSingleQuotes`: Whether to use single quotes `'` (instead of double) in the generated code. Alternatively, you can add `index.gen.js` as an exception in your linter config.

### Example: Custom directories
If your project uses non-standard directories (e.g., `dist/` instead of `lib/`):
```javascript
// ./ffse.config.js
import defineConfig from "firebase-functions-smart-export/cli/defineConfig";

export default defineConfig({
  sourceDir: 'src',
  outDir: 'dist',
});
```

## TypeScript and ESM
FFSE ships with TypeScript definitions and works straight out of the box in TypeScript projects. By default, FFSE uses `src/` as the source directory and uses `lib/` as the compiled output directory containing your JavaScript files. If your project uses different directories, configure `sourceDir` and `outDir` in your `ffse.config.js`.


## Limitations
- FFSE assumes that your source directory structure matches your output directory structure after compilation. This is the default behavior of TypeScript and most build tools.

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