import dlv from 'dlv';
import { dset } from 'dset';
import type { Config } from '../../shared/types/config.js';
import type { FunctionReference, FunctionRegistry } from '../../shared/types/function_registry.js';
import { parseExportKeyFromPath, parseFunctionIdFromPath } from './function_path_parser.js';

/**
 * The maximum number of characters in a function ID. This includes both the groups
 * and the function name.
 */
const FUNCTION_ID_CHARACTER_LIMIT = 62;


/**
 * Builds a FunctionRegistry from a list of function file paths.
 *
 * Each file path is transformed into a function ID and added to the registry.
 * The resulting registry contains exactly one entry per input file - no files
 * are filtered or skipped. Duplicate function IDs or IDs exceeding the character
 * limit will throw an error rather than being silently ignored.
 *
 * @param files - The list of function file paths to register.
 * @param config - Configuration options affecting ID generation.
 * @returns A registry with the same number of entries as input files.
 */
export function buildFunctionRegistry(
  files: string[],
  config: Config,
): FunctionRegistry {
  const registry: FunctionRegistry = {};

  for (const filePath of files) {

    const functionId = parseFunctionIdFromPath(filePath, config);
    const exportKey = parseExportKeyFromPath(filePath, config);

    if (functionId.length > FUNCTION_ID_CHARACTER_LIMIT) {
      throw new Error(
        `Function ${functionId} exceeds the ${FUNCTION_ID_CHARACTER_LIMIT} character limit.`
      );
    }

    const existingReferenceForId: FunctionReference = dlv(registry, functionId);
    if (existingReferenceForId) {
      throw new Error(`
        The same function name (${functionId}) was generated from the following paths:
        1) ${existingReferenceForId[0]}
        2) ${filePath}

        Please change either your file structure or "ffse.config.json" to ensure these paths produce unique function names.
      `);
    }

    // The export key should only saved if it differs to the function ID.
    const includeExportKey = functionId !== exportKey;

    dset(
      registry,
      functionId,
      includeExportKey ? [filePath, exportKey] : [filePath],
    );
  }

  return registry;
}