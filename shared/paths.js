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
 */
export function getAbsSourceDirPath() {
    const root = getAbsProjectRootPath();
    const srcDir = join(root, 'src');
    if (fs.existsSync(srcDir))
        return srcDir;
    return join(root, 'lib');
}
