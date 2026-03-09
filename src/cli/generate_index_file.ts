import fs from 'node:fs';
import { join } from 'node:path';
import type { Config } from '../shared/types/config.js';

/** The name of the generated index file. */
export const GENERATED_INDEX_FILE_NAME = 'index.gen.js';

/**
 * Simple signature for a function that applies a transformation to a `string`.
*/
type StringTransformer = (text: string) => string;

export const EMPTY_REGISTRY_ERROR_MESSAGE =
  'Cannot generate index file: no functions found. This should not be called with an empty function list.';

/**
 * Creates a function that wraps a given string in quotes based on the `useSingleQuotes`
 * flag in the config.
 *
 * Quote character defaults to `"` if no preference is given.
 *
 * @returns A function that takes a string and returns it wrapped in the configured quotes.
 */
function getQuoteWrapperFor(config: Config): StringTransformer {
  const quoteCharacter = config.useSingleQuotes ? `'` : `"`;
  return (text: string) => `${quoteCharacter}${text}${quoteCharacter}`;
}

function writeImportsAndSetup(config: Config): string {
  const quote = getQuoteWrapperFor(config);
  return [
    '// GENERATED CODE - DO NOT MODIFY BY HAND',
    `import { createExportMap } from ${quote('firebase-functions-smart-export')};`,
    '',
    `const exportMap = await createExportMap();`,
    ''
  ].join('\n');
}

function writeExports(topLevelKeys: string[]): string {
  const lines: string[] = [];
  for (const key of topLevelKeys) {
    lines.push(`export const ${key} = exportMap.${key};`);
  }
  return lines.join('\n');
}

/**
 * Generates the index file that exports all functions.
 *
 * Writes a JS file to the source directory containing imports, setup code,
 * and export statements for each top-level group or function.
 *
 * @param preferredSourceDir - The directory to write the generated file to.
 * @param topLevelKeys - The unique top-level export key names.
 * @param config - Configuration options affecting output format.
 */
export async function generateIndexFile(
  preferredSourceDir: string,
  topLevelKeys: string[],
  config: Config,
): Promise<void> {
  if (topLevelKeys.length === 0) {
    throw new Error(EMPTY_REGISTRY_ERROR_MESSAGE);
  }

  const contents = [
    writeImportsAndSetup(config),
    writeExports(topLevelKeys)
  ].join('\n\n');

  fs.writeFileSync(join(preferredSourceDir, GENERATED_INDEX_FILE_NAME), contents, 'utf8');
}
