import glob from 'fast-glob';

export const DEFAULT_MATCH_EXTENSION = 'function';


/**
 * Recursively finds all files matching the extension pattern in the given directory.
 *
 * Paths are rewritten to `.js` because the generated index runs against the
 * compiled output, where all sources resolve to `.js` regardless of authoring.
 *
 * @param sourceDir - Directory to search, relative or absolute.
 * @param matchExtension - Custom extension (excluding `.js`) used to identify
 *   function files. Defaults to `'function'`, matching files like `foo.function.ts`.
 * @returns An object containing:
 *   - `files`: deduplicated paths with `.js` extensions, relative to `sourceDir`.
 *   - `hasMixedFileTypes`: `true` if both `.ts` and `.js` function files coexist in source.
 */
export function findFunctionFiles(
  sourceDir: string,
  matchExtension: string = DEFAULT_MATCH_EXTENSION,
): { files: string[]; hasMixedFileTypes: boolean } {
  const relativePaths = glob.sync(`**/*.${matchExtension}.[jt]s`, {
    cwd: sourceDir,
    onlyFiles: true,
  });

  const hasTsFiles = relativePaths.some(path => path.endsWith('.ts'));
  const hasJsFiles = relativePaths.some(path => path.endsWith('.js'));

  const jsPaths = relativePaths.map(
    path => path.endsWith('.ts') ? path.slice(0, -3) + '.js' : path
  );

  return {
    files: [...new Set(jsPaths)],
    hasMixedFileTypes: hasTsFiles && hasJsFiles,
  };
}
