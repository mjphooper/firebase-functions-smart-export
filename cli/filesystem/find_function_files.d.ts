/**
 * Finds all compiled function files in the `lib/` directory matching the configured extension pattern.
 *
 * Uses `fast-glob` to search for files like `*.function.js`, excluding the top-level `lib/` from the group path.
 */
export declare function findFunctionFiles(globWorkingDirectory: string, matchExtension?: string): string[];
