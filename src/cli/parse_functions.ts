import type { Config } from './config.js';
import { parseExportKeyFromPath } from './function_path_parser.js';

export interface ParsedFunction {
  exportKey: string;
  filePath: string;
}

/**
 * Maps each function file path to its parsed export key.
 *
 * Performs no validation — callers are responsible for enforcing length limits,
 * uniqueness, etc.
 */
export function parseFunctions(
  files: string[],
  config: Config,
): ParsedFunction[] {
  return files.map(filePath => ({
    exportKey: parseExportKeyFromPath(filePath, config),
    filePath,
  }));
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
