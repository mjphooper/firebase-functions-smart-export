import { parseExportKeyFromPath, parseFunctionIdFromPath } from '../shared/function_path_parser.js';
/**
 * The maximum number of characters in a function ID. This includes both the groups
 * and the function name.
 */
const FUNCTION_ID_CHARACTER_LIMIT = 62;
/**
 * Validates function file paths and extracts the top-level export keys needed
 * for generating `index.gen.js`.
 *
 * Each file path is parsed into a function ID and export key, then validated
 * against the character limit and checked for duplicates. The resulting
 * top-level keys are the unique first segments of each function ID.
 *
 * @param files - The list of function file paths to validate.
 * @param config - Configuration options affecting ID generation.
 * @returns The unique top-level export keys and the list of validated functions.
 */
export function validateFunctions(files, config) {
    const seen = new Map();
    const topLevelKeys = new Set();
    const functions = [];
    for (const filePath of files) {
        const functionId = parseFunctionIdFromPath(filePath, config);
        const exportKey = parseExportKeyFromPath(filePath, config);
        if (functionId.length > FUNCTION_ID_CHARACTER_LIMIT) {
            throw new Error(`Function ${functionId} exceeds the ${FUNCTION_ID_CHARACTER_LIMIT} character limit.`);
        }
        const existingPath = seen.get(functionId);
        if (existingPath) {
            throw new Error(`
        The same function name (${functionId}) was generated from the following paths:
        1) ${existingPath}
        2) ${filePath}

        Please change either your file structure or "ffse.config.json" to ensure these paths produce unique function names.
      `);
        }
        seen.set(functionId, filePath);
        const firstSegment = functionId.split('.')[0];
        topLevelKeys.add(firstSegment);
        functions.push({ functionId, exportKey, filePath });
    }
    return {
        topLevelKeys: [...topLevelKeys],
        functions,
    };
}
