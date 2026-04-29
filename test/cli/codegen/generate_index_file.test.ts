import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fs from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { EMPTY_FUNCTIONS_ERROR_MESSAGE, GENERATED_INDEX_FILE_NAME, generateIndexFile } from '../../../src/cli/generate_index_file.js';
import type { ParsedFunction } from '../../../src/cli/parse_functions.js';
import { Config } from '../../../src/cli/config.js';

use(chaiAsPromised);

const __dirname = dirname(fileURLToPath(import.meta.url));
const testDir = resolve(__dirname, '../temp_fixtures');

function readGeneratedFile() {
  return fs.readFileSync(resolve(testDir, GENERATED_INDEX_FILE_NAME), 'utf8');
}

function makeFunction(exportKey: string, filePath: string): ParsedFunction {
  return { exportKey, filePath };
}

describe('generateIndexFile()', () => {
  const doubleQuoteConfig: Config = { useSingleQuotes: false };

  beforeEach(() => {
    fs.mkdirSync(testDir);
  });

  afterEach(async () => {
    await fs.promises.rmdir(testDir, { recursive: true });
  });

  it('throws if the functions list is empty', async () => {
    await expect(generateIndexFile(testDir, [], doubleQuoteConfig)).to.be.rejectedWith(
      EMPTY_FUNCTIONS_ERROR_MESSAGE,
    );
  });

  it('inlines the runtime and writes functionMap initialization', async () => {
    await generateIndexFile(testDir, [makeFunction('foo', 'foo.function.js')], doubleQuoteConfig);

    const content = readGeneratedFile();
    expect(content).to.match(/function createExportMap\b/);
    expect(content).to.not.match(/from ["']firebase-functions-smart-export["']/);
    expect(content).to.contain('const functionMap = {');
    expect(content).to.contain('const exportMap = await createExportMap(functionMap);');
  });

  it('writes functionMap entries with project-root-relative paths', async () => {
    await generateIndexFile(
      testDir,
      [makeFunction('auth.onCreate', 'auth/onCreate.function.js')],
      doubleQuoteConfig,
    );

    const content = readGeneratedFile();
    expect(content).to.contain('"auth.onCreate": "lib/auth/onCreate.function.js"');
  });

  it('uses custom outDir from config', async () => {
    const config: Config = { outDir: 'build' };
    await generateIndexFile(
      testDir,
      [makeFunction('auth.onCreate', 'auth/onCreate.function.js')],
      config,
    );

    const content = readGeneratedFile();
    expect(content).to.contain('"auth.onCreate": "build/auth/onCreate.function.js"');
  });

  it('writes named exports for each top-level key', async () => {
    await generateIndexFile(
      testDir,
      [makeFunction('foo.bar', 'foo/bar.function.js'), makeFunction('baz.qux', 'baz/qux.function.js')],
      doubleQuoteConfig,
    );

    const content = readGeneratedFile();
    expect(content).to.contain('export const foo = exportMap.foo;');
    expect(content).to.contain('export const baz = exportMap.baz;');
  });

  it('quote style reflects config in the function map', async () => {
    const config: Config = { useSingleQuotes: true };
    await generateIndexFile(
      testDir,
      [makeFunction('auth.onCreate', 'auth/onCreate.function.js')],
      config,
    );

    const content = readGeneratedFile();
    expect(content).to.contain(`'auth.onCreate': 'lib/auth/onCreate.function.js'`);
  });
});
