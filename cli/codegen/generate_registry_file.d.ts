import type { FunctionRegistry } from '../../shared/types/function_registry.js';
/**
 * Writes the given function registry object as a formatted JSON file to disk.
 *
 * This JSON file serves as a static registry of all discovered Firebase
 * functions, enabling faster runtime lookup without scanning the filesystem.
 *
 * The output file path is fixed by the {@link REGISTRY_FILE_NAME} constant.
 */
export declare function generateRegistryFile(path: string, registry: FunctionRegistry): void;
