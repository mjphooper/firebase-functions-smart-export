import fs from 'node:fs';
import { join } from 'node:path';
import { getAbsSourceDirPath } from '../../shared/paths.js';
import { GENERATED_INDEX_FILE_NAME } from '../constants/generated_index_file_name.js';

/**
 * Deletes previously generated files before a new run.
 * Silent if files do not exist.
 */
export function cleanupGeneratedFiles(sourceDir?: string): void {
  const absSourcePath = getAbsSourceDirPath(sourceDir);
  const indexPath = join(absSourcePath, GENERATED_INDEX_FILE_NAME);

  if (fs.existsSync(indexPath)) fs.unlinkSync(indexPath);
}
