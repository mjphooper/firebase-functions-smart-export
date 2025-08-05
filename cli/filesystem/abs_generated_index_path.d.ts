/**
 * Returns the absolute path to the generated `index.gen.js` file.
 *
 * Prefers placing the generated file in the `src/` directory if it exists.
 * If not, it falls back to the `lib/` directory if present.
 * If neither directory exists, it places the file in the project root.
 */
export declare function getAbsGeneratedIndexPath(): Promise<string>;
