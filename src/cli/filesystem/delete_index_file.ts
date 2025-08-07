import fs from 'node:fs';
import { join } from 'node:path';
import { getAbsSourceDirPath } from '../../shared/paths.js';
import { GENERATED_INDEX_FILE_NAME } from '../constants/generated_index_file_name.js';


/**
 * Deletes the generated index file if it exists.
 *
 * This operation is silent if the file does not exist.
 */
export async function deleteIndexFile(): Promise<void> {
  const absSourcePath = getAbsSourceDirPath();
  const indexPath = join(absSourcePath, GENERATED_INDEX_FILE_NAME);
  if (fs.existsSync(indexPath)) {
    fs.unlinkSync(indexPath);
  }
}