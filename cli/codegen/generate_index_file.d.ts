import type { Config } from '../../shared/types/config.js';
import type { FunctionRegistry } from '../../shared/types/function_registry.js';
export declare const EMPTY_REGISTRY_ERROR_MESSAGE = "Cannot generate an `index.gen.js` for an empty registry.";
export declare function generateIndexFile(preferredSourceDir: string, registry: FunctionRegistry, config: Config): Promise<void>;
