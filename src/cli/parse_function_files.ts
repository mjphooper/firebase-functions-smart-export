import { camelCase } from 'change-case';
import slash from 'slash';
import type { Config } from './config.js';
import { transformGroups } from './transform_groups.js';

export interface ParsedFunction {
  exportKey: string;
  filePath: string;
}

/**
 * Parses a single function file path into a `ParsedFunction`.
 *
 * The file name must match the pattern `*.<matchExtension>.js` (e.g.,
 * `myFunc.function.js`); the last two extensions are stripped to determine
 * the function name. The folder segments and file name are transformed into
 * a dot-separated camelCase export key, after applying any group filtering
 * or remapping defined in the config.
 *
 * Performs no validation beyond filename shape — callers are responsible for
 * enforcing length limits, uniqueness, etc.
 *
 * @throws If the file name does not match the expected pattern.
 */
export function parseFunctionFile(
  filePath: string,
  config: Config,
): ParsedFunction {
  const splitPath = slash(filePath).split('/');
  const fileName = splitPath.pop();

  const match = fileName.match(/^(.*)\.[^.]+\.js$/);
  if (!match) {
    throw new Error(`Expected file name to match pattern "*.<matchExtension>.js", but got "${fileName}"`);
  }

  const groups = transformGroups([...splitPath], config);
  const exportKey = [...groups, match[1]].map(value => camelCase(value)).join('.');

  return { exportKey, filePath };
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
