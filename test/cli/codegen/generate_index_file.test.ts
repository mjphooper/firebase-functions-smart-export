import { expect } from 'chai';
import fs from 'fs';
import { resolve } from 'path';
import { EMPTY_FUNCTIONS_ERROR_MESSAGE, GENERATED_INDEX_FILE_NAME, generateIndexFile } from '../../../src/cli/generate_index_file.js';
import type { ParsedFunction } from '../../../src/cli/parse_function_files.js';
import type { Config } from '../../../src/cli/config.js';
import { useSandbox } from '../../helpers/sandbox.js';

function makeParsedFunction(exportKey: string, filePath: string): ParsedFunction {
  return { exportKey, filePath };
}

describe('generateIndexFile()', () => {
  const sandbox = useSandbox();
  const doubleQuoteConfig: Config = { useSingleQuotes: false };

  function readGeneratedFile() {
    return fs.readFileSync(resolve(sandbox.path(), GENERATED_INDEX_FILE_NAME), 'utf8');
  }

  it('throws if the functions list is empty', async () => {
    // Act
    const result = generateIndexFile(sandbox.path(), [], doubleQuoteConfig);

    // Assert
    await expect(result).to.be.rejectedWith(EMPTY_FUNCTIONS_ERROR_MESSAGE);
  });

  it('inlines the runtime and writes functionMap initialization', async () => {
    // Act
    await generateIndexFile(sandbox.path(), [makeParsedFunction('foo', 'foo.function.js')], doubleQuoteConfig);

    // Assert
    const content = readGeneratedFile();
    expect(content).to.match(/function createExportMap\b/);
    expect(content).to.not.match(/from ["']firebase-functions-smart-export["']/);
    expect(content).to.contain('const functionMap = {');
    expect(content).to.contain('const exportMap = await createExportMap(functionMap);');
  });

  it('writes functionMap entries with project-root-relative paths', async () => {
    // Act
    await generateIndexFile(
      sandbox.path(),
      [makeParsedFunction('auth.onCreate', 'auth/onCreate.function.js')],
      doubleQuoteConfig,
    );

    // Assert
    const content = readGeneratedFile();
    expect(content).to.contain('"auth.onCreate": "lib/auth/onCreate.function.js"');
  });

  it('uses custom outDir from config', async () => {
    // Arrange
    const config: Config = { outDir: 'build' };

    // Act
    await generateIndexFile(
      sandbox.path(),
      [makeParsedFunction('auth.onCreate', 'auth/onCreate.function.js')],
      config,
    );

    // Assert
    const content = readGeneratedFile();
    expect(content).to.contain('"auth.onCreate": "build/auth/onCreate.function.js"');
  });

  it('writes named exports for each top-level key', async () => {
    // Act
    await generateIndexFile(
      sandbox.path(),
      [makeParsedFunction('foo.bar', 'foo/bar.function.js'), makeParsedFunction('baz.qux', 'baz/qux.function.js')],
      doubleQuoteConfig,
    );

    // Assert
    const content = readGeneratedFile();
    expect(content).to.contain('export const foo = exportMap.foo;');
    expect(content).to.contain('export const baz = exportMap.baz;');
  });

  it('quote style reflects config in the function map', async () => {
    // Arrange
    const config: Config = { useSingleQuotes: true };

    // Act
    await generateIndexFile(
      sandbox.path(),
      [makeParsedFunction('auth.onCreate', 'auth/onCreate.function.js')],
      config,
    );

    // Assert
    const content = readGeneratedFile();
    expect(content).to.contain(`'auth.onCreate': 'lib/auth/onCreate.function.js'`);
  });
});
