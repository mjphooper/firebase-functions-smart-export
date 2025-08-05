import fs from 'node:fs';
import { getAbsGeneratedIndexPath } from './abs_generated_index_path.js';
/**
 * Deletes the generated index file if it exists.
 *
 * This function removes the previously generated index file,
 * if one is present at the configured path. It should be run
 * before regeneration to avoid stale or partial output.
 *
 * This operation is silent if the file does not exist.
 */
export async function deleteIndexFile() {
    const indexPath = await getAbsGeneratedIndexPath();
    if (fs.existsSync(indexPath)) {
        fs.unlinkSync(indexPath);
    }
}
