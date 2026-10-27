import fs from 'node:fs';
import { join } from 'node:path';
import type { ExportTree } from './build_export_tree.js';
import type { Config } from './config.js';
import type { ProjectLanguage } from './project_language.js';
import type { ParsedFunction } from './parse_function_files.js';

/** The name of the generated index file, in the project's language. */
export function getGeneratedIndexFileName(language: ProjectLanguage): string {
  return `index.gen.${language}`;
}

type StringTransformer = (text: string) => string;

/**
 * Returns a function that wraps text in the configured quote character,
 * escaping backslashes and that quote character.
 */
function getQuoteWrapperFor(config: Config): StringTransformer {
  const quoteCharacter = config.useSingleQuotes ? `'` : `"`;
  return (text: string) => {
    const escaped = text.replaceAll('\\', '\\\\').replaceAll(quoteCharacter, `\\${quoteCharacter}`);
    return `${quoteCharacter}${escaped}${quoteCharacter}`;
  };
}

/** The lowercase key the generated code compares against the normalised target. */
function toTargetKey(exportKey: string): string {
  return exportKey.toLowerCase();
}

/** The import specifier for a function file, relative to the generated index. */
function toImportPath(filePath: string): string {
  return `./${filePath.replace(/\\/g, '/')}`;
}

// Typed so each export keeps its function's type. The index signature stops
// a module without a default export failing to compile, so it reaches the
// runtime check instead.
const TYPED_LOAD_SIGNATURE =
  '<T>(key: string, path: string, importer: () => Promise<{ default?: T; [name: string]: unknown }>): Promise<T> | undefined';

// Declared locally so the TS index compiles without @types/node.
const TYPED_PROCESS_DECLARATION = 'declare const process: { env: Record<string, string | undefined> };';

// Helpers start with `_` so they can never clash with an export: `camelCase`
// strips leading underscores, so no export key can start with one. The output
// sticks to ES2017 (no `replaceAll`), the target of Firebase's TS template.
function writeSetup(functions: ParsedFunction[], quote: StringTransformer, language: ProjectLanguage): string {
  const targetKeys = functions.map(({ exportKey }) => quote(toTargetKey(exportKey))).join(', ');
  const loadSignature = language === 'ts' ? TYPED_LOAD_SIGNATURE : '(key, path, importer)';
  return [
    ...(language === 'ts' ? [TYPED_PROCESS_DECLARATION, ''] : []),
    `const _target = (process.env.FUNCTION_TARGET || process.env.K_SERVICE || ${quote('')}).replace(/-/g, ${quote('.')}).toLowerCase();`,
    '',
    `if (_target && ![${targetKeys}].includes(_target)) {`,
    '  throw new Error(`Function "${_target}" not found in index.gen.js. Have you run ffse since adding it?`);',
    '}',
    '',
    `const _load = ${loadSignature} => !_target || _target === key`,
    '  ? importer().then((module) => {',
    '      if (module.default === undefined) {',
    '        throw new Error(`Function at path ${path} has no default export. Did you forget to add "export default" to the function definition?`);',
    '      }',
    '      return module.default;',
    '    })',
    '  : undefined;',
  ].join('\n');
}

function writeLoads(functions: ParsedFunction[], quote: StringTransformer): string {
  const loads = functions.map(({ exportKey, filePath }) => {
    const path = quote(toImportPath(filePath));
    return `  _load(${quote(toTargetKey(exportKey))}, ${path}, () => import(${path})),`;
  });
  return `const _functions = await Promise.all([\n${loads.join('\n')}\n]);`;
}

function writeExportValue(value: ExportTree | number): string {
  if (typeof value === 'number') return `_functions[${value}]`;
  const entries = [...value].map(([key, child]) => `${key}: ${writeExportValue(child)}`);
  return `{ ${entries.join(', ')} }`;
}

function writeExports(exportTree: ExportTree): string {
  return [...exportTree]
    .map(([key, value]) => `export const ${key} = ${writeExportValue(value)};`)
    .join('\n');
}

/**
 * Generates the index file that exports all functions.
 *
 * Writes a self-contained file to the source directory, as `index.gen.ts`
 * with types or `index.gen.js` to match the project's language. It reads the
 * function target from `FUNCTION_TARGET` or `K_SERVICE` and imports only that
 * function's module, or every module in parallel when no target is set (as
 * during deploy discovery). An unknown target throws at import time.
 *
 * Imports are relative to the generated file, so the compiled output must
 * mirror the source directory's structure.
 *
 * @param preferredSourceDir - The directory to write the generated file to.
 * @param functions - The validated functions with export keys and file paths.
 * @param exportTree - The nested exports, built from `functions` by
 * `buildExportTree()`. Its leaves index into `functions`.
 * @param config - Configuration options affecting output format.
 * @param language - The project's language, which the generated file matches.
 */
export async function generateIndexFile(
  preferredSourceDir: string,
  functions: ParsedFunction[],
  exportTree: ExportTree,
  config: Config,
  language: ProjectLanguage,
): Promise<void> {
  if (functions.length === 0) {
    throw new Error('Cannot generate index file: no functions found. This should not be called with an empty function list.');
  }

  const quote = getQuoteWrapperFor(config);

  const contents = [
    '// GENERATED CODE - DO NOT MODIFY BY HAND',
    writeSetup(functions, quote, language),
    '',
    writeLoads(functions, quote),
    '',
    writeExports(exportTree),
    '',
  ].join('\n');

  fs.writeFileSync(join(preferredSourceDir, getGeneratedIndexFileName(language)), contents, 'utf8');
}
