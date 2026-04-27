/* istanbul ignore file */
import fs from 'fs';
import { join, resolve } from 'path';
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
export function getAbsSourceDirPath(sourceDir) {
    const root = getAbsProjectRootPath();
    // If sourceDir is explicitly configured, use it directly.
    if (sourceDir) {
        const configuredDir = join(root, sourceDir);
        if (!fs.existsSync(configuredDir)) {
            throw new Error(`Configured sourceDir "${sourceDir}" does not exist at ${configuredDir}.`);
        }
        return configuredDir;
    }
    // Auto-detect: if a 'src' directory exists, select this as the source path.
    const srcDir = join(root, 'src');
    if (fs.existsSync(srcDir)) {
        return srcDir;
    }
    // If a 'lib' directory exists, select this.
    const libDir = join(root, 'lib');
    if (fs.existsSync(libDir)) {
        return libDir;
    }
    // If neither exist, throw an error.
    throw new Error(`Could not find source directory. Expected "src/" or "lib/" to exist in ${root}. ` +
        `If your project uses a different directory, configure "sourceDir" in ffse.config.js.`);
}
