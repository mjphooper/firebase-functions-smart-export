import fs from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { EMPTY_FUNCTIONS_ERROR_MESSAGE, GENERATED_INDEX_FILE_NAME, generateIndexFile } from '../../../src/cli/generate_index_file.js';
import { Config } from '../../../src/shared/types/config.js';


const __dirname = dirname(fileURLToPath(import.meta.url));
const testDir = resolve(__dirname, '../temp_fixtures')

function readGeneratedFile() {
  return fs.readFileSync(resolve(testDir, GENERATED_INDEX_FILE_NAME), 'utf8');
}

describe('generateIndexFile()', () => {
  const doubleQuoteConfig: Config = { useSingleQuotes: false };

  beforeEach(() => {
    fs.mkdirSync(testDir);
  });

  afterEach(async () => {
    await fs.promises.rmdir(testDir, { recursive: true });
  });

  test('throws if the top-level keys list is empty', async () => {
    // Act & Assert
    await expect(generateIndexFile(testDir, [], doubleQuoteConfig)).rejects.toThrow(
      EMPTY_FUNCTIONS_ERROR_MESSAGE
    );
  });

  test('writes imports and exportMap initialization', async () => {
    // Act
    await generateIndexFile(testDir, ['foo'], doubleQuoteConfig);

    // Expect
    const content = readGeneratedFile();
    expect(content).toContain('import { createExportMap } from "firebase-functions-smart-export";');
    expect(content).toContain('const exportMap = await createExportMap();');
  });

  test('writes named exports for each top-level key', async () => {
    // Act
    await generateIndexFile(testDir, ['foo', 'bar'], doubleQuoteConfig);

    // Assert
    const content = readGeneratedFile();
    expect(content).toContain('export const foo = exportMap.foo;');
    expect(content).toContain('export const bar = exportMap.bar;');
  });

  test('quote style reflects config', async () => {
    const config: Config = { useSingleQuotes: true };

    await generateIndexFile(testDir, ['foo'], config);

    const content = readGeneratedFile();
    expect(content).toContain(`import { createExportMap } from 'firebase-functions-smart-export';`);
  });
});
