import type { ParsedFunction } from './parse_function_files.js';

/** Maximum length of a Firebase Cloud Function name. */
export const FUNCTION_NAME_CHARACTER_LIMIT = 62;

/** A single problem found by `validateFunctions()`. */
export interface ValidationError {
  /** What is wrong and, where useful, how to fix it. */
  message: string;
  /** The function files involved, relative to the source directory. */
  filePaths: string[];
}

/**
 * Runs every check against the parsed functions and returns all problems found.
 *
 * Checks never short-circuit: a function that fails one check is still passed
 * to the rest, so a single run reports everything that needs fixing. An empty
 * result means the functions are safe to export.
 */
export function validateFunctions(functions: ParsedFunction[]): ValidationError[] {
  const oversized = findOversizedFunctions(functions, FUNCTION_NAME_CHARACTER_LIMIT).map(fn => ({
    message: `"${fn.exportKey}" exceeds the ${FUNCTION_NAME_CHARACTER_LIMIT} character limit for function names.`,
    filePaths: [fn.filePath],
  }));

  const duplicates = findDuplicateFunctions(functions).map(group => ({
    message:
      `Conflicting function names ${group.map(fn => `"${fn.exportKey}"`).join(', ')}. ` +
      'Names must be unique within a project, ignoring case. ' +
      'Change your file structure or "ffse.config.js" to resolve the conflict.',
    filePaths: group.map(fn => fn.filePath),
  }));

  return [...oversized, ...duplicates];
}

/**
 * Returns all functions whose export key exceeds `limit` characters.
 *
 * The limit applies to the full dot-separated export key, including any group
 * segments. An empty result means every key is within the limit.
 */
export function findOversizedFunctions(
  functions: ParsedFunction[],
  limit: number,
): ParsedFunction[] {
  return functions.filter(fn => fn.exportKey.length > limit);
}

/**
 * Returns all groups of functions whose export keys collide case-insensitively.
 *
 * Each returned group contains two or more functions sharing the same lowercased
 * export key. An empty result means every export key is unique.
 *
 * Case-insensitive comparison is required because the Cloud Run runtime resolves
 * `FUNCTION_TARGET` / `K_SERVICE` in lowercase, so names that differ only in
 * case would collide at runtime.
 */
export function findDuplicateFunctions(functions: ParsedFunction[]): ParsedFunction[][] {
  const grouped = Map.groupBy(functions, fn => fn.exportKey.toLowerCase());
  return [...grouped.values()].filter(group => group.length > 1);
}
