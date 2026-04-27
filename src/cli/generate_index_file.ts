import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from '../shared/types/config.js';
import type { ValidatedFunction } from './validate_functions.js';

/** The name of the generated index file. */
export const GENERATED_INDEX_FILE_NAME = 'index.gen.js';

type StringTransformer = (text: string) => string;

export const EMPTY_FUNCTIONS_ERROR_MESSAGE =
  'Cannot generate index file: no functions found. This should not be called with an empty function list.';

function findOwnPackageRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (dir !== dirname(dir)) {
    if (fs.existsSync(join(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('Could not locate firebase-functions-smart-export package root');
}

function readRuntimeBundle(): string {
  const bundlePath = join(findOwnPackageRoot(), 'runtime.bundle.js');
  return fs.readFileSync(bundlePath, 'utf8');
}

function getQuoteWrapperFor(config: Config): StringTransformer {
  const quoteCharacter = config.useSingleQuotes ? `'` : `"`;
  return (text: string) => `${quoteCharacter}${text}${quoteCharacter}`;
}

function writeFunctionMap(functions: ValidatedFunction[], outDir: string, config: Config): string {
  const quote = getQuoteWrapperFor(config);
  const entries = functions.map(({ exportKey, filePath }) => {
    const path = join(outDir, filePath).replace(/\\/g, '/');
    return `  ${quote(exportKey)}: ${quote(path)}`;
  });
  return `const functionMap = {\n${entries.join(',\n')},\n};`;
}

function writeImportsAndSetup(functions: ValidatedFunction[], outDir: string, config: Config): string {
  return [
    '// GENERATED CODE - DO NOT MODIFY BY HAND',
    readRuntimeBundle().trimEnd(),
    '',
    writeFunctionMap(functions, outDir, config),
    '',
    `const exportMap = await createExportMap(functionMap);`,
    ''
  ].join('\n');
}

function writeExports(functions: ValidatedFunction[]): string {
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
export async function generateIndexFile(
  preferredSourceDir: string,
  functions: ValidatedFunction[],
  config: Config,
): Promise<void> {
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
