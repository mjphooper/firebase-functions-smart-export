import { camelCase } from "change-case";
import { Config } from "../../shared/types/config.js";
import { FunctionExportKey, FunctionId } from "../../shared/types/function_id.js";
import { transformGroups } from "./transform_groups.js";

/**
 * Converts a relative file path into a camelCase export key used for exporting functions.
 *
 * The file name must match the pattern `*.{matchExtension}.js` (e.g., `myFunc.function.js`), 
 * where the last two extensions are removed to determine the function name (`myFunc`).
 *
 * The export key is constructed by transforming the folder path and file name into dot-separated 
 * camelCase segments, after applying any group filtering or remapping defined in the config.
 *
 * @param filePath - The relative file path of the function module
 * @param config - The transformation rules for groups (e.g., ignore, map, depth)
 * @returns A dot-separated camelCase export key (e.g., `group.subGroup.myFunc`)
 * @throws If the file name does not match the expected `*.{matchExtension}.js` pattern
 */
export function parseExportKeyFromPath(
  filePath: string,
  config: Config,
): FunctionExportKey {
  const splitPath = filePath.split('/');

  const fileName = splitPath.pop();

  const match = fileName.match(/^(.*)\.[^.]+\.js$/);
  if (!match) {
    throw new Error(`Expected file name to match pattern "*.<matchExtension>.js", but got "${fileName}"`);
  }
  const functionName = match[1];

  const groups = transformGroups([...splitPath], config);

  return [...groups, functionName]
    .map(value => camelCase(value))
    .join('.');
}

/**
 * Converts a relative file path to a lowercase function ID used for internal registry storage.
 * 
 * Internally calls `filePathToExportKey`, then lowercases the result.
 */
export function parseFunctionIdFromPath(
  relPath: string,
  config: Config,
): FunctionId {
  return parseExportKeyFromPath(relPath, config).toLowerCase();
}