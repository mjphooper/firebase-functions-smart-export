import fs from 'fs';
import { join } from 'node:path';
import { getAbsProjectRootPath } from '../../shared/project_root_path.js';

/**
 * Determines the most likely path to the directory containing the user's source code.
 * 
 * This will return either a path ending in `/src` (typical for Typescript projects) or
 * `/lib` (typical for Javascript projects).
 */
export function getPreferredSourceDir(): string {
  const root = getAbsProjectRootPath();
  const srcDir = join(root, 'src');

  if (fs.existsSync(srcDir)) return srcDir;

  return join(root, 'lib');
}
