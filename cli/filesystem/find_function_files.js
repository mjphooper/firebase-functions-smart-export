import glob from 'fast-glob';
import { DEFAULT_MATCH_EXTENSION } from '../constants/default_match_extension.js';
/**
 * Replaces the extension of any file ending in `.ts` with `.js`.
 */
function normalizePathsToJS(...paths) {
    return paths.map((path) => {
        if (path.endsWith('.ts'))
            return path.slice(0, -3) + '.js';
        return path;
    });
}
/**
 * Recursively finds all files matching the extension pattern in the given directory.
 *
 * Returns a list of corresponding file paths transformed to point to `.js` files inside
 * the `lib/` directory.
 */
export function findFunctionFiles(sourceDir, matchExtension = DEFAULT_MATCH_EXTENSION) {
    // The paths relative to the `sourceDir`.
    const relativePaths = glob.sync(`**/*.${matchExtension}.[jt]s`, {
        cwd: sourceDir,
        onlyFiles: true,
    });
    const normalizedPaths = normalizePathsToJS(...relativePaths);
    return [...new Set(normalizedPaths)];
}
