import glob from 'fast-glob';


export const DEFAULT_MATCH_EXTENSION = 'function';

/**
 * Result of finding function files.
 */
export interface FindFunctionFilesResult {
  /** The list of function file paths, normalized to .js extensions. */
  files: string[];
  /** Whether both .ts and .js function files were found. */
  hasMixedFileTypes: boolean;
}

/**
 * Replaces the extension of any file ending in `.ts` with `.js`.
 */
function normalizePathsToJS(...paths: string[]): string[] {
  return paths.map((path) => {
    if (path.endsWith('.ts')) return path.slice(0, -3) + '.js';
    return path;
  });
}


/**
 * Recursively finds all files matching the extension pattern in the given directory.
 *
 * Returns a list of corresponding file paths transformed to point to `.js` files,
 * along with a flag indicating if both .ts and .js files were found.
 */
export function findFunctionFiles(
  sourceDir: string,
  matchExtension: string = DEFAULT_MATCH_EXTENSION,
): FindFunctionFilesResult {
  // The paths relative to the `sourceDir`.
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