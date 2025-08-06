import fs from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { GENERATED_INDEX_FILE_NAME } from '../../../cli/constants/generated_index_file_name.js';
import { EMPTY_REGISTRY_ERROR_MESSAGE, generateIndexFile } from '../../../src/cli/codegen/generate_index_file.js';
import { Config } from '../../../src/shared/types/config.js';
import { FunctionReference, FunctionRegistry } from '../../../src/shared/types/function_registry.js';


const __dirname = dirname(fileURLToPath(import.meta.url));
const tempFixturesDir = resolve(__dirname, '../temp_fixtures')
const testIndexFilePath = resolve(tempFixturesDir, GENERATED_INDEX_FILE_NAME);

function readGeneratedFile() {
  return fs.readFileSync(testIndexFilePath, 'utf8');
}

describe('generateIndexFile()', () => {
  const doubleQuoteConfig: Config = { useSingleQuotes: false };
  const emptyReference: FunctionReference = [''];

  beforeEach(() => {
    fs.mkdirSync(tempFixturesDir);
  });

  afterEach(async () => {
    await fs.promises.rmdir(tempFixturesDir, { recursive: true });
  });

  test('throws if the function registry is empty', async () => {
    // Arrange
    const registry: FunctionRegistry = {};

    // Act & Assert
    await expect(generateIndexFile(testIndexFilePath, registry, doubleQuoteConfig)).rejects.toThrow(
      EMPTY_REGISTRY_ERROR_MESSAGE
    );
  });

  test('writes imports and exportMap initialization', async () => {
    // Arrange
    const registry: FunctionRegistry = { foo: emptyReference };

    // Act
    await generateIndexFile(testIndexFilePath, registry, doubleQuoteConfig);

    // Expect
    const content = readGeneratedFile();
    expect(content).toContain('import { createExportMap } from "firebase-functions-smart-export";');
    expect(content).toContain('const exportMap = await createExportMap(registry);');
  });

  test('writes named exports for each top-level key', async () => {
    // Arrange
    const registry: FunctionRegistry = {
      foo: emptyReference,
      bar: {
        baz: emptyReference,
      },
    };

    // Act
    await generateIndexFile(testIndexFilePath, registry, doubleQuoteConfig);

    // Assert
    const content = readGeneratedFile();
    expect(content).toContain('export const foo = exportMap.foo;');
    expect(content).toContain('export const bar = exportMap.bar;');
  });

  test('quote style reflects config', async () => {
    const registry: FunctionRegistry = { foo: emptyReference };
    const config: Config = { useSingleQuotes: true };

    await generateIndexFile(testIndexFilePath, registry, config);

    const content = readGeneratedFile();
    expect(content).toContain(`import { createExportMap } from 'firebase-functions-smart-export';`);
  });
});
