import { Config } from '../../shared/types/config.js';
import { FunctionRegistry } from '../../shared/types/function_registry.js';
/**
 * Builds a FunctionRegistry by scanning the compiled `lib/` directory for function files.
 *
 * Each function file's relative path is transformed into a function ID and optionally an export key,
 * then added to the registry. Throws an error if the function ID exceeds the character limit.
 */
export declare function buildFunctionRegistry(files: string[], config: Config): FunctionRegistry;
