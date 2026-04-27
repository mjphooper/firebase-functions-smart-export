import type { Config } from '../shared/types/config.js';
export interface ValidatedFunction {
    functionId: string;
    exportKey: string;
    filePath: string;
}
export interface ValidationResult {
    topLevelKeys: string[];
    functions: ValidatedFunction[];
}
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
export declare function validateFunctions(files: string[], config: Config): ValidationResult;
