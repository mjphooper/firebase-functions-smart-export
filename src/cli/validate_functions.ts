import type { ParsedFunction } from './parse_function_files.js';

/** Maximum length of a Firebase Cloud Function name. */
export const FUNCTION_NAME_CHARACTER_LIMIT = 62;

/**
 * A single problem found by `validateFunctions()`.
 *
 * Every issue carries a user-facing `message` and the files involved. `type`
 * and the remaining fields describe what was found, for callers and tests that
 * need more than the message.
 */
type ValidationIssue = {
  /** What is wrong and, where useful, how to fix it. */
  message: string;
  /** The function files involved, relative to the source directory. */
  filePaths: string[];
} & (
    | { type: 'too-long'; exportKey: string; limit: number }
    | { type: 'duplicate-names'; exportKeys: string[] }
  );

/**
 * Runs every check against the parsed functions and returns all issues found.
 *
 * Checks never short-circuit: a function that fails one check is still passed
 * to the rest, so a single run reports everything that needs fixing. Issues
 * from per-function checks come first, in check order, followed by collisions
 * between functions. An empty result means the functions are safe to export.
 */
export function validateFunctions(functions: ParsedFunction[]): ValidationIssue[] {
  const checks = [checkLength];
  const functionIssues = checks.flatMap(check => functions.map(check).filter(issue => issue !== null));

  return [...functionIssues, ...findDuplicateNames(functions)];
}

/**
 * Flags an export key longer than {@link FUNCTION_NAME_CHARACTER_LIMIT}.
 *
 * The limit applies to the full dot-separated export key, including any group
 * segments.
 */
function checkLength({ exportKey, filePath }: ParsedFunction): ValidationIssue | null {
  if (exportKey.length <= FUNCTION_NAME_CHARACTER_LIMIT) return null;
  return {
    type: 'too-long',
    exportKey,
    limit: FUNCTION_NAME_CHARACTER_LIMIT,
    filePaths: [filePath],
    message: `"${exportKey}" exceeds the ${FUNCTION_NAME_CHARACTER_LIMIT} character limit for function names.`,
  };
}

/**
 * Returns one issue per group of functions whose export keys collide
 * case-insensitively.
 *
 * Case-insensitive comparison is required because the Cloud Run runtime resolves
 * `FUNCTION_TARGET` / `K_SERVICE` in lowercase, so names that differ only in
 * case would collide at runtime.
 */
function findDuplicateNames(functions: ParsedFunction[]): ValidationIssue[] {
  const grouped = Map.groupBy(functions, fn => fn.exportKey.toLowerCase());

  return [...grouped.values()]
    .filter(group => group.length > 1)
    .map(group => {
      const exportKeys = group.map(fn => fn.exportKey);
      const listFormat = new Intl.ListFormat('en-GB', { type: 'conjunction' });

      return {
        type: 'duplicate-names',
        exportKeys,
        filePaths: group.map(fn => fn.filePath),
        message:
          `Conflicting function names ${listFormat.format(exportKeys.map(key => `"${key}"`))}. ` +
          'Names must be unique within a project, ignoring case. ' +
          'Change your file structure or "ffse.config.js" to resolve the conflict.',
      };
    });
}
