import glob from 'fast-glob';
import { styledConsoleOutput } from '../../shared/styled_console_log.js';

export const DEFAULT_MATCH_EXTENSION = 'function';

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
 * Returns a list of file paths transformed to point to `.js` files.
 * Logs a warning if both .ts and .js function files are found.
 */
export function findFunctionFiles(
  sourceDir: string,
  matchExtension: string = DEFAULT_MATCH_EXTENSION,
): string[] {
  const relativePaths = glob.sync(`**/*.${matchExtension}.[jt]s`, {
    cwd: sourceDir,
    onlyFiles: true,
  });

  const hasTsFiles = relativePaths.some(p => p.endsWith('.ts'));
  const hasJsFiles = relativePaths.some(p => p.endsWith('.js'));

  if (hasTsFiles && hasJsFiles) {
    styledConsoleOutput.warn(
      'Found both .ts and .js function files. Set `allowJs: true` in tsconfig.json to include .js files in compilation.'
    );
  }

  const normalizedPaths = normalizePathsToJS(...relativePaths);
  return [...new Set(normalizedPaths)];
}