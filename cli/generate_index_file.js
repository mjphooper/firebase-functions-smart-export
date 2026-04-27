import fs from 'node:fs';
import { join } from 'node:path';
/** The name of the generated index file. */
export const GENERATED_INDEX_FILE_NAME = 'index.gen.js';
export const EMPTY_FUNCTIONS_ERROR_MESSAGE = 'Cannot generate index file: no functions found. This should not be called with an empty function list.';
function getQuoteWrapperFor(config) {
    const quoteCharacter = config.useSingleQuotes ? `'` : `"`;
    return (text) => `${quoteCharacter}${text}${quoteCharacter}`;
}
function writeFunctionMap(functions, outDir, config) {
    const quote = getQuoteWrapperFor(config);
    const entries = functions.map(({ exportKey, filePath }) => {
        const path = join(outDir, filePath).replace(/\\/g, '/');
        return `  ${quote(exportKey)}: ${quote(path)}`;
    });
    return `const functionMap = {\n${entries.join(',\n')},\n};`;
}
function writeImportsAndSetup(functions, outDir, config) {
    const quote = getQuoteWrapperFor(config);
    return [
        '// GENERATED CODE - DO NOT MODIFY BY HAND',
        `import { createExportMap } from ${quote('firebase-functions-smart-export')};`,
        '',
        writeFunctionMap(functions, outDir, config),
        '',
        `const exportMap = await createExportMap(functionMap);`,
        ''
    ].join('\n');
}
function writeExports(functions) {
    const topLevelKeys = [...new Set(functions.map(({ exportKey }) => exportKey.split('.')[0]))];
    return topLevelKeys.map((key) => `export const ${key} = exportMap.${key};`).join('\n');
}
/**
 * Generates the index file that exports all functions.
 *
 * Writes a JS file to the source directory containing a pre-computed
 * `functionMap` (exportKey → path), setup code, and top-level export
 * statements.
 *
 * @param preferredSourceDir - The directory to write the generated file to.
 * @param functions - The validated functions with export keys and file paths.
 * @param config - Configuration options affecting output format.
 */
export async function generateIndexFile(preferredSourceDir, functions, config) {
    if (functions.length === 0) {
        throw new Error(EMPTY_FUNCTIONS_ERROR_MESSAGE);
    }
    const outDir = config.outDir ?? 'lib';
    const contents = [
        writeImportsAndSetup(functions, outDir, config),
        writeExports(functions),
    ].join('\n');
    fs.writeFileSync(join(preferredSourceDir, GENERATED_INDEX_FILE_NAME), contents, 'utf8');
}
