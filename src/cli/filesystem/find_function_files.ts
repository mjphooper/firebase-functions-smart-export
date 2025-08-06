import glob from 'fast-glob';
import { join } from 'path';
import { DEFAULT_MATCH_EXTENSION } from '../constants/default_match_extension.js';

/**
 * Returns a list of paths transformed such that each path points to a `.js` file the `lib` directory.
 * Each path is transformed in the following way:
 * - The first element is replaced with `lib`
 * - The final file extension is replaced with `.js`
 * 
 * This is used to allow functions to be discovered in non-`lib` directories (such as in
 * `src` for Typescript projects) but for the final function paths to point to the
 * (eventually) compiled Javascript files in `lib`.
 * 
 * This assumes the compiled file structure of `lib` will be identical to that of the non-`lib`
 * directory.
 * 
 * @example
 * ```
 * normalizePathsToLib('src/foo/bar.function.js'); // Returns 'lib/foo/bar.function.js'
 * normalizePathsToLib('lib/foo/bar.function.ts'); // Returns 'lib/foo/bar.function.js'
 * normalizePathToLib('src/lib/foo.function.ts'); // Returns 'lib/lib/foo.function.js'
 *
 */
function normalizePathsToCompiledLib(...paths: string[]): string[] {
  return paths.map((path) => {
    const segments = path.split('/');

    // Ensure file name is `.js`
    const fileName = segments.pop();
    const fileNameWithJs = fileName.replace(/\.[^.]+$/, '.js');

    // Remove existing root directory
    segments.shift();

    return join('lib', ...segments, fileNameWithJs);
  });
}


/**
 * Recursively finds all files matching the extension pattern in the given directory.
 * 
 * Returns a list of corresponding file paths transformed to point to `.js` files inside
 * the `lib/` directory.
 */
export function findFunctionFiles(
  sourceDir: string,
  matchExtension: string = DEFAULT_MATCH_EXTENSION,
): string[] {
  const libOrSrcRootPaths = glob.sync(`**/*.${matchExtension}.[jt]s`, {
    cwd: sourceDir,
  });
  return normalizePathsToCompiledLib(...libOrSrcRootPaths);
}