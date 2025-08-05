import { calculateRegistrySize } from '../../shared/calculate_registry_size.js';
import { REGISTRY_FILE_NAME } from '../constants/registry_file_name.js';
export const EMPTY_REGISTRY_ERROR_MESSAGE = 'Cannot generate an `index.gen.js` for an empty registry.';
/**
 * Creates a function that wraps a given string in quotes based on the `useSingleQuotes`
 * flag in the config.
 *
 * Quote character defaults to `"` if no preference is given.
 *
 * @returns A function that takes a string and returns it wrapped in the configured quotes.
 *
 * @example
 * ```ts
 * const config = { useSingleQuotes: false };
 * const wrap = getQuoteWrapperFor(config2);
 * console.log(wrap('hello')); // Output: "hello"
 * ```
 */
function getQuoteWrapperFor(config) {
    const quoteCharacter = config.useSingleQuotes ? `'` : `"`;
    return (text) => `${quoteCharacter}${text}${quoteCharacter}`;
}
/**
 * Writes import statements and initializes the export map in the generated index file.
 *
 * @param file The source file being generated.
 * @param config The resolved configuration used to determine import style.
 */
function writeImportsAndSetup(file, config) {
    const quote = getQuoteWrapperFor(config);
    file.addStatements([
        '// GENERATED CODE - DO NOT MODIFY BY HAND',
        `import { createExportMap } from ${quote('firebase-functions-smart-export')};`,
        `import registry from ${quote(`./../${REGISTRY_FILE_NAME}`)} with { type: ${quote('json')} };`,
        '\n',
        `const exportMap = await createExportMap(registry);`,
    ]);
}
/**
 * Writes named exports to the index file for each top-level key in the function registry.
 *
 * @param file The source file being generated.
 * @param registry The function registry mapping identifiers to file paths.
 * @param config The resolved configuration used to determine quoting style.
 */
function writeExports(file, registry) {
    const statements = ['\n'];
    for (const topLevelGroupOrName of Object.keys(registry)) {
        statements.push(`export const ${topLevelGroupOrName} = exportMap.${topLevelGroupOrName};`);
    }
    file.addStatements(statements);
}
/**
 * Generates the `index.gen.js` file based on the provided non-empty function registry
 * and configuration.
 *
 * @throws Error if the registry is empty.
 */
export async function generateIndexFile(file, registry, config) {
    if (calculateRegistrySize(registry) === 0) {
        throw Error(EMPTY_REGISTRY_ERROR_MESSAGE);
    }
    writeImportsAndSetup(file, config);
    writeExports(file, registry);
    file.saveSync();
}
