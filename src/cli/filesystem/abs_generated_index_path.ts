import { join } from 'node:path';
import { getAbsProjectRootPath } from '../../shared/project_root_path.js';
import { GENERATED_INDEX_FILE_NAME } from '../constants/generated_index_file_name.js';

/**
 * Returns the absolute path to the generated `index.gen.js` file.
 *
 * Prefers placing the generated file in the `src/` directory if it exists.
 * If not, it falls back to the `lib/` directory if present.
 * If neither directory exists, it places the file in the project root.
 */
export async function getAbsGeneratedIndexPath() {
  const fs = await import('fs');

  const root = getAbsProjectRootPath();
  const src = join(root, 'src');
  const lib = join(root, 'lib');

  if (fs.existsSync(src)) {
    return join(src, GENERATED_INDEX_FILE_NAME);
  }

  if (fs.existsSync(lib)) {
    return join(lib, GENERATED_INDEX_FILE_NAME);
  }

  return join(root, GENERATED_INDEX_FILE_NAME);
}
