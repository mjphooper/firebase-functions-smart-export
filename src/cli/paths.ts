/* istanbul ignore file */
import fs from 'fs';
import { join, resolve } from 'path';
import { DEFAULT_OUT_DIR, DEFAULT_SOURCE_DIR } from './config.js';

/** Returns the absolute path to the root of the user's project. */
export function getAbsProjectRootPath() {
  return resolve(process.cwd());
}

/**
 * The absolute path to the project's source code directory.
 *
 * For JavaScript projects, this is typically the absolute path
 * to `lib/`, and for TypeScript projects the path to `src/`.
 *
 * @param sourceDir - Optional explicit source directory from config. If provided, skips auto-detection.
 */
export function getAbsSourceDirPath(sourceDir?: string): string {
  const root = getAbsProjectRootPath();

  // If sourceDir is explicitly configured, use it directly.
  if (sourceDir) {
    const configuredDir = join(root, sourceDir);
    if (!fs.existsSync(configuredDir)) {
      throw new Error(
        `Configured sourceDir "${sourceDir}" does not exist at ${configuredDir}.`
      );
    }
    return configuredDir;
  }

  // Auto-detect: prefer src/ (TS projects), fall back to lib/ (JS projects).
  const srcDir = join(root, DEFAULT_SOURCE_DIR);
  if (fs.existsSync(srcDir)) {
    return srcDir;
  }

  const libDir = join(root, DEFAULT_OUT_DIR);
  if (fs.existsSync(libDir)) {
    return libDir;
  }

  throw new Error(
    `Could not find source directory. Expected "${DEFAULT_SOURCE_DIR}/" or "${DEFAULT_OUT_DIR}/" to exist in ${root}. ` +
    `If your project uses a different directory, configure "sourceDir" in ffse.config.js.`
  );
}