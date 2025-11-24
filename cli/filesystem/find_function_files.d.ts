/**
 * Recursively finds all files matching the extension pattern in the given directory.
 *
 * Returns a list of corresponding file paths transformed to point to `.js` files inside
 * the `lib/` directory.
 */
export declare function findFunctionFiles(sourceDir: string, matchExtension?: string): string[];
