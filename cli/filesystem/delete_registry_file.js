import fs from 'node:fs';
import { REGISTRY_FILE_NAME } from "../constants/registry_file_name.js";
/**
 * Deletes the existing registry file if it exists.
 *
 * This operation is silent if the file does not exist.
 */
export function deleteRegistryFile() {
    if (fs.existsSync(REGISTRY_FILE_NAME)) {
        fs.unlinkSync(REGISTRY_FILE_NAME);
    }
}
