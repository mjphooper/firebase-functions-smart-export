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
 * Performs no validation beyond filename shape; `validateFunctions()` enforces
 * length limits, uniqueness, etc.
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
