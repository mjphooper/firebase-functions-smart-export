export declare const DEFAULT_MATCH_EXTENSION = "function";
export interface FindFunctionFilesResult {
    files: string[];
    hasMixedFileTypes: boolean;
}
/**
 * Recursively finds all files matching the extension pattern in the given directory.
 *
 * Returns a list of file paths transformed to point to `.js` files, along with
 * whether both `.ts` and `.js` function files were found.
 */
export declare function findFunctionFiles(sourceDir: string, matchExtension?: string): FindFunctionFilesResult;
