import { SourceFile } from 'ts-morph';
import { Config } from '../../shared/types/config.js';
import { FunctionRegistry } from '../../shared/types/function_registry.js';
export declare const EMPTY_REGISTRY_ERROR_MESSAGE = "Cannot generate an `index.gen.js` for an empty registry.";
/**
 * Generates the `index.gen.js` file based on the provided non-empty function registry
 * and configuration.
 *
 * @throws Error if the registry is empty.
 */
export declare function generateIndexFile(file: SourceFile, registry: FunctionRegistry, config: Config): Promise<void>;
