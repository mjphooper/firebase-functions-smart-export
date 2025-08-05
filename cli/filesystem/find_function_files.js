import glob from 'fast-glob';
import { DEFAULT_MATCH_EXTENSION } from '../constants/default_match_extension.js';
/**
 * Finds all compiled function files in the `lib/` directory matching the configured extension pattern.
 *
 * Uses `fast-glob` to search for files like `*.function.js`, excluding the top-level `lib/` from the group path.
 */
export function findFunctionFiles(globWorkingDirectory, matchExtension = DEFAULT_MATCH_EXTENSION) {
    return glob.sync(`**/*.${matchExtension}.js`, {
        cwd: globWorkingDirectory,
    });
}
