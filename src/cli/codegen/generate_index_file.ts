import fs from 'node:fs';
import path from 'node:path';
import { calculateRegistrySize } from '../../shared/calculate_registry_size.js';
import type { Config } from '../../shared/types/config.js';
import type { FunctionRegistry } from '../../shared/types/function_registry.js';
import { REGISTRY_FILE_NAME } from '../constants/registry_file_name.js';


export const EMPTY_REGISTRY_ERROR_MESSAGE = 'Cannot generate an `index.gen.js` for an empty registry.';

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
  return [
    '// GENERATED CODE - DO NOT MODIFY BY HAND',
    `import { createExportMap } from ${quote('firebase-functions-smart-export')};`,
    `import registry from ${quote(`./../${REGISTRY_FILE_NAME}`)} with { type: ${quote('json')} };`,
    '',
    `const exportMap = await createExportMap(registry);`,
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

export async function generateIndexFile(
  filePath: string,
  registry: FunctionRegistry,
  config: Config,
): Promise<void> {
  if (calculateRegistrySize(registry) === 0) {
    throw Error(EMPTY_REGISTRY_ERROR_MESSAGE);
  }

  const contents = [
    writeImportsAndSetup(config),
    writeExports(registry)
  ].join('\n\n');

  fs.writeFileSync(path.resolve(filePath), contents, 'utf8');
}