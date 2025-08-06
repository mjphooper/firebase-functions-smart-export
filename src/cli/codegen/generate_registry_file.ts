import * as fs from 'fs';
import { join } from 'path';
import type { FunctionRegistry } from '../../shared/types/function_registry.js';
import { REGISTRY_FILE_NAME } from '../constants/registry_file_name.js';

/**
 * Writes the given function registry object as a formatted JSON file to disk.
 *
 * This JSON file serves as a static registry of all discovered Firebase
 * functions, enabling faster runtime lookup without scanning the filesystem.
 *
 * The output file path is fixed by the {@link REGISTRY_FILE_NAME} constant.
 */
export function generateRegistryFile(path: string, registry: FunctionRegistry) {
  fs.writeFileSync(
    join(path, REGISTRY_FILE_NAME),
    JSON.stringify(registry, null, 2),
    'utf8',
  );
}

