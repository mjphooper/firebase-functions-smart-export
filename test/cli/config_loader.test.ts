import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fs from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { getConfig } from '../../src/cli/config_loader.js';
import { Config } from '../../src/cli/config.js';

use(chaiAsPromised);

describe('config_loader', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  let fixturesPath: string;
  let testCounter = 0;

  function createFakeConfigFile(config: unknown): void {
    const filePath = resolve(fixturesPath, 'ffse.config.js');
    const contents = `export default ${JSON.stringify(config)};\n`;
    fs.writeFileSync(filePath, contents);
  }

  beforeEach(() => {
    testCounter++;
    fixturesPath = resolve(__dirname, `temp_config_loader_${testCounter}`);
    fs.mkdirSync(fixturesPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.promises.rm(fixturesPath, { recursive: true, force: true });
  });

  it('loads config if the file exists', async () => {
    const fileConfig: Config = { useSingleQuotes: true };
    createFakeConfigFile(fileConfig);

    const config = await getConfig(fixturesPath);

    expect(config).to.deep.equal(fileConfig);
  });

  it('returns an empty object if the config file does not exist', async () => {
    const config = await getConfig(fixturesPath);

    expect(config).to.deep.equal({});
  });

  it('returns an empty object if the file does not have a default export', async () => {
    createFakeConfigFile(undefined);

    const config = await getConfig(fixturesPath);

    expect(config).to.deep.equal({});
  });

  it('throws if default export is not an object', async () => {
    createFakeConfigFile(10);

    await expect(getConfig(fixturesPath)).to.be.rejectedWith(Error);
  });
});
