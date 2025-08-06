# firebase-functions-smart-export

  
Firebase Functions Smart Export ("FFSE" for short) is a dynamic function exporter that streamlines function exporting and aims to improves cold start times. FFSE is a [pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c),
  
## Motivation
Cold starts in Firebase Functions can be slow, especially as your project grows in dependencies. By default, node evaluates the entirety of your project before executing any single function, which means even unused code and dependencies can slow down cold starts. There are [some tricks](https://youtu.be/v3eG9xpzNXM) to circumvent this, but these can be cumbersome to maintain as your project grows in size.

A great solution was provided by [better-firebase-functions](https://www.npmjs.com/package/better-firebase-functions) (along with this excellent [article](https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://medium.com/swlh/a-toolkit-to-speed-up-and-optimise-firebase-cloud-functions-part-1-6f74f278660c&ved=2ahUKEwiJ75SB9faOAxX6W0EAHXWnOKgQFnoECB4QAQ&usg=AOvVaw0JcGk46yxFD_BMCb-PG_o_)). However, its lack of ESM support led to the birth of this project with two key improvements:

1. Built from the ground up for **ESM projects**, allowing you to stay up to date with modern tooling.
2. Uses a prebuilt **function lookup table** to minimize runtime dependencies, enabling a tiny runtime script that resolves modules even faster.

## How it works
  
🔍   **1.** The CLI tool searches your project for files matching the default glob pattern `*.function` which exports  Firebase Functions with corresponding names. To learn more, see [Exporting functions](#exporting-functions).

🛠️ **2.**  Two files are then built:
- `ffse.registry.json` JSON file containing a lookup table of functions and their corresponding module paths.
- `index.gen.js` Generated code placed in `lib` (or `/src`) that exports your functions in an	ESM compatible manner.

⚡️**3.**  At runtime, FFSE uses your `ffse.registry.json` and a lightweight script to export only the module required by the instance in which it is running, avoiding the overhead of loading unused dependencies.
  

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

3. Run the CLI tool (and every time you modify your functions) to build your function registry.
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
- `matchExtension`: The file extension used to identify the files containing your functions. This defaults to `".function"`.
- `ignoreGroups`: A list of groups to exclude from the final function name. This can be used to remove path segments with no semantic value from the exported function name.
- `maxGroupCount`: Limits the number of groups in function names.
- `disableGroups`: Removes groups entirely from function names.
- `mapGroups`: Custom mapper that allows you to apply any transformation to the list of groups proposed for a given function.
- `useSingleQuotes`: Whether to use single quotes `'` (instead of double) in the generated code. Alternatively, you can add `index.gen.js` as an exception in your linter config.

## Performance
_(To do)_

## TypeScript and ESM
FFSE ships with TypeScript definitions and  works straight out the box in TypeScript projects. Just ensure your `index.ts` and function definitions are within `src/` and that the file structure of  `lib/` matches that of `src/` after compilation.


## Limitations
- FFSE's project parsing is currently not very robust and expects a default Firebase Functions setup. If you've moved, renamed, or otherwise fiddled with `lib/` or `lib/index.js` (or the Typescript equivalents), it will probably not work. Please feel free to [contribute](#contributing) or open an issue if it's not working for you!

  
<a name="contributing"></a>
## Contributing

This project would love contributions! Please feel free to open an issue or submit a PR. This project uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) so please be sure to follow the spec when making PRs!


## License
MIT