import fs from 'fs';
import { dirname, join, resolve } from 'path';
import { DEFAULT_OUT_DIR, DEFAULT_SOURCE_DIR } from './config.js';

/**
 * The absolute path to the project's source code directory.
 *
 * Without a configured `sourceDir`, auto-detects in this order:
 * 1. `src/`, for TypeScript projects. Checked first because their `main`
 *    points into the compiled output (`lib/index.js`), not the sources.
 * 2. The folder holding the `package.json` `main` entry, for JavaScript
 *    projects. The `firebase init` template puts `index.js` at the root.
 * 3. `lib/`, for JavaScript projects that don't declare `main`.
 *
 * @param cwd - The working directory to resolve from.
 * @param sourceDir - Optional explicit source directory from config. If provided, skips auto-detection.
 */
export function getAbsSourceDirPath(
  cwd: string,
  sourceDir: string | undefined,
): string {
  const root = resolve(cwd);

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

  const candidates = [
    join(root, DEFAULT_SOURCE_DIR),
    getMainEntryDir(root),
    join(root, DEFAULT_OUT_DIR),
  ];

  const detected = candidates.find(dir => dir !== undefined && fs.existsSync(dir));
  if (detected) return detected;

  throw new Error(
    `Could not find source directory. Expected "${DEFAULT_SOURCE_DIR}/", the folder holding package.json's "main", or "${DEFAULT_OUT_DIR}/" to exist in ${root}. ` +
    `If your project uses a different directory, configure "sourceDir" in ffse.config.js.`
  );
}

/**
 * The absolute path to the folder holding the `package.json` `main` entry.
 *
 * @returns `undefined` if `package.json` is missing or doesn't declare `main`.
 */
function getMainEntryDir(root: string): string | undefined {
  const packageJsonPath = join(root, 'package.json');
  if (!fs.existsSync(packageJsonPath)) return undefined;

  const { main } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return typeof main === 'string' ? dirname(join(root, main)) : undefined;
}
