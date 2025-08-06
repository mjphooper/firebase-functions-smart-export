import fs from 'node:fs';
import { join } from 'node:path';
import { GENERATED_INDEX_FILE_NAME } from '../constants/generated_index_file_name.js';
import { getPreferredSourceDir } from './preferred_source_dir.js';


/**
 * Deletes the generated index file if it exists.
 *
 * This operation is silent if the file does not exist.
 */
export async function deleteIndexFile(): Promise<void> {
  const indexPath = join(getPreferredSourceDir(), GENERATED_INDEX_FILE_NAME);
  if (fs.existsSync(indexPath)) {
    fs.unlinkSync(indexPath);
  }
}