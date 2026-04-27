/** Returns the absolute path to the root of the user's project. */
export declare function getAbsProjectRootPath(): string;
/**
 * The absolute path to the project's source code directory.
 *
 * For JavaScript projects, this is typically the absolute path
 * to `lib/`, and for TypeScript projects the path to `src/`.
 *
 * @param sourceDir - Optional explicit source directory from config. If provided, skips auto-detection.
 */
export declare function getAbsSourceDirPath(sourceDir?: string): string;
