/* istanbul ignore file */
import { resolve } from 'path';

/** Returns the absolute path to the root of the user's project. */
export function getAbsProjectRootPath() {
  return resolve(process.cwd());
}