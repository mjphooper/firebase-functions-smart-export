import fs from 'node:fs';
import { join } from 'node:path';
import type { Config } from '../../shared/types/config.js';
import type { FunctionRegistry } from '../../shared/types/function_registry.js';
import { GENERATED_INDEX_FILE_NAME } from '../constants/generated_index_file_name.js';
import { REGISTRY_FILE_NAME } from '../constants/registry_file_name.js';

/**
 * Simple signature for a function that applies a transformation to a `string`.
*/
type StringTransformer = (text: string) => string;

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
function getQuoteWrapperFor(config: Config): StringTransformer {
  const quoteCharacter = config.useSingleQuotes ? `'` : `"`;
  return (text: string) => `${quoteCharacter}${text}${quoteCharacter}`;
}

function writeImportsAndSetup(config: Config): string {
  const quote = getQuoteWrapperFor(config);
  const outDir = config.outDir ?? 'lib';
  return [
    '// GENERATED CODE - DO NOT MODIFY BY HAND',
    `import { createExportMap } from ${quote('firebase-functions-smart-export')};`,
    `import registry from ${quote(`./../${REGISTRY_FILE_NAME}`)} with { type: ${quote('json')} };`,
    '',
    `const exportMap = await createExportMap(registry, { outDir: ${quote(outDir)} });`,
    ''
  ].join('\n');
}

function writeExports(registry: FunctionRegistry): string {
  const lines: string[] = [];
  for (const topLevelGroupOrName of Object.keys(registry)) {
    lines.push(`export const ${topLevelGroupOrName} = exportMap.${topLevelGroupOrName};`);
  }
  return lines.join('\n');
}

/**
 * Generates the index file that exports all functions from the registry.
 *
 * Writes a JS file to the source directory containing imports, setup code,
 * and export statements for each top-level group or function in the registry.
 *
 * Should not be called with an empty registry. An empty registry will produce
 * a file with no exports, which serves no purpose.
 *
 * @param preferredSourceDir - The directory to write the generated file to.
 * @param registry - The function registry to generate exports from.
 * @param config - Configuration options affecting output format.
 */
export function generateIndexFile(
  preferredSourceDir: string,
  registry: FunctionRegistry,
  config: Config,
): void {
  const contents = [
    writeImportsAndSetup(config),
    writeExports(registry)
  ].join('\n\n');

  fs.writeFileSync(join(preferredSourceDir, GENERATED_INDEX_FILE_NAME), contents, 'utf8');
}