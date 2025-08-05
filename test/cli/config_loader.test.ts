import { jest } from '@jest/globals';
import fs from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { getConfig } from '../../src/cli/config_loader.js';
import { runContext } from '../../src/shared/run_context.js';
import { Config } from '../../src/shared/types/config.js';

describe('config_loader', () => {

  beforeAll(() => {
    runContext.isTest = true;
  });

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const fixturesPath = resolve(__dirname, './temp_fixtures');

  function createFakeConfigFile(config: unknown): void {
    const filePath = resolve(fixturesPath, 'ffse.config.js');
    const contents = `export default ${JSON.stringify(config)};\n`;
    fs.writeFileSync(filePath, contents);
  }


  beforeEach(() => {
    fs.mkdirSync(fixturesPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.promises.rm(fixturesPath, { recursive: true, force: true });
    jest.resetModules();
  });

  it('loads config if the file exists', async () => {
    // Arrange
    const fileConfig: Config = { useSingleQuotes: true };
    createFakeConfigFile(fileConfig);

    // Act
    const config = await getConfig(fixturesPath)

    // Assert
    expect(config).toEqual(fileConfig);
  });

  it('returns an empty object if the config file does not exist', async () => {
    // Act
    const config = await getConfig(fixturesPath)

    // Assert
    expect(config).toEqual({});
  });

  it('returns an empty object if the file does not have a default export', async () => {
    // Arrange
    createFakeConfigFile(undefined);

    // Act
    const config = await getConfig(fixturesPath)

    // Assert
    expect(config).toEqual({});
  });

  it('throws if default export is not an object', async () => {
    // Arrange
    createFakeConfigFile(10);

    // Act & Assert
    expect(() => getConfig(fixturesPath)).rejects.toThrow();
  });

});