import glob from 'fast-glob';
export const DEFAULT_MATCH_EXTENSION = 'function';
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
 * Returns a list of file paths transformed to point to `.js` files, along with
 * whether both `.ts` and `.js` function files were found.
 */
export function findFunctionFiles(sourceDir, matchExtension = DEFAULT_MATCH_EXTENSION) {
    const relativePaths = glob.sync(`**/*.${matchExtension}.[jt]s`, {
        cwd: sourceDir,
        onlyFiles: true,
    });
    const hasTsFiles = relativePaths.some(p => p.endsWith('.ts'));
    const hasJsFiles = relativePaths.some(p => p.endsWith('.js'));
    const normalizedPaths = normalizePathsToJS(...relativePaths);
    return {
        files: [...new Set(normalizedPaths)],
        hasMixedFileTypes: hasTsFiles && hasJsFiles,
    };
}
