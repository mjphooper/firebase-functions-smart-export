import fs from 'node:fs';
import { join } from 'node:path';
import { calculateRegistrySize } from '../../shared/calculate_registry_size.js';
import { GENERATED_INDEX_FILE_NAME } from '../constants/generated_index_file_name.js';
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
function writeImportsAndSetup(config) {
    const quote = getQuoteWrapperFor(config);
    return [
        '// GENERATED CODE - DO NOT MODIFY BY HAND',
        `import { createExportMap } from ${quote('firebase-functions-smart-export')};`,
        `import registry from ${quote(`./../${REGISTRY_FILE_NAME}`)} with { type: ${quote('json')} };`,
        '',
        `const exportMap = await createExportMap(registry);`,
        ''
    ].join('\n');
}
function writeExports(registry) {
    const lines = [];
    for (const topLevelGroupOrName of Object.keys(registry)) {
        lines.push(`export const ${topLevelGroupOrName} = exportMap.${topLevelGroupOrName};`);
    }
    return lines.join('\n');
}
export async function generateIndexFile(preferredSourceDir, registry, config) {
    if (calculateRegistrySize(registry) === 0) {
        throw Error(EMPTY_REGISTRY_ERROR_MESSAGE);
    }
    const contents = [
        writeImportsAndSetup(config),
        writeExports(registry)
    ].join('\n\n');
    fs.writeFileSync(join(preferredSourceDir, GENERATED_INDEX_FILE_NAME), contents, 'utf8');
}
