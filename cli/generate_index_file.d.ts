import type { Config } from '../shared/types/config.js';
import type { ValidatedFunction } from './validate_functions.js';
/** The name of the generated index file. */
export declare const GENERATED_INDEX_FILE_NAME = "index.gen.js";
export declare const EMPTY_FUNCTIONS_ERROR_MESSAGE = "Cannot generate index file: no functions found. This should not be called with an empty function list.";
/**
 * Generates the index file that exports all functions.
 *
 * Writes a JS file to the source directory containing a pre-computed
 * `functionMap` (exportKey → path), setup code, and top-level export
 * statements.
 *
 * @param preferredSourceDir - The directory to write the generated file to.
 * @param functions - The validated functions with export keys and file paths.
 * @param config - Configuration options affecting output format.
 */
export declare function generateIndexFile(preferredSourceDir: string, functions: ValidatedFunction[], config: Config): Promise<void>;
