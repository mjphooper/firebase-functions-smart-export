import { expect } from 'chai';
import * as fs from 'fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as path from 'path';
import { DEFAULT_MATCH_EXTENSION, findFunctionFiles } from '../../src/shared/find_function_files.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const tempFixturesDir = path.resolve(__dirname, 'temp_find_function_files');
const libDir = path.join(tempFixturesDir, 'lib');

const matchExtension = DEFAULT_MATCH_EXTENSION;

function writeEmptyFile(dir: string, config?: {
  ext?: string,
  name?: string,
}) {
  const name = config?.name ?? 'test';
  let ext = config?.ext ?? 'js';
  while (ext.length > 0 && ext[0] === '.') {
    ext = ext.slice(1);
  }
  fs.writeFileSync(`${dir}/${name}.${matchExtension}.${ext}`, '');
}

beforeEach(() => {
  fs.mkdirSync(libDir, { recursive: true });
});

afterEach(async () => {
  await fs.promises.rm(tempFixturesDir, { recursive: true, force: true });
});

it('finds single file matching extension', () => {
  writeEmptyFile(libDir);

  const { files } = findFunctionFiles(libDir, matchExtension);

  expect(files).to.have.lengthOf(1);
});

it('matches file with same name as matchExtension', () => {
  writeEmptyFile(libDir, { name: 'function' });

  const { files } = findFunctionFiles(libDir, matchExtension);

  expect(files).to.have.lengthOf(1);
});

it('finds nested files matching extension', () => {
  const level1 = path.join(libDir, 'level_1');
  const level2 = path.join(level1, 'level_2');
  fs.mkdirSync(level1);
  fs.mkdirSync(level2);
  writeEmptyFile(libDir);
  writeEmptyFile(level1);
  writeEmptyFile(level2);

  const { files } = findFunctionFiles(libDir, matchExtension);

  expect(files).to.have.lengthOf(3);
});

it('ignores files not matching extension', () => {
  writeEmptyFile(libDir, { ext: 'jsx' });
  writeEmptyFile(libDir, { ext: 'ts' });
  writeEmptyFile(libDir, { ext: 'mjs' });
  writeEmptyFile(libDir, { ext: 'js' });

  const { files } = findFunctionFiles(libDir, matchExtension);

  expect(files).to.have.lengthOf(1);
});

it('returns empty list when no files match extension', () => {
  writeEmptyFile(libDir, { ext: 'txt' });

  const { files } = findFunctionFiles(libDir, matchExtension);

  expect(files).to.have.lengthOf(0);
});

it('returns empty list when no files exist', () => {
  const { files } = findFunctionFiles(libDir, matchExtension);

  expect(files).to.have.lengthOf(0);
});

it('does not match files with identifier but no name', () => {
  writeEmptyFile(libDir, { name: '' });

  const { files } = findFunctionFiles(libDir, matchExtension);

  expect(files).to.have.lengthOf(0);
});

it('does not match files with extra dots after .function.js', () => {
  writeEmptyFile(libDir, { ext: 'js.txt' });
  writeEmptyFile(libDir, { ext: 'js.js' });

  const { files } = findFunctionFiles(libDir, matchExtension);

  expect(files).to.have.lengthOf(0);
});

it('uses DEFAULT_MATCH_EXTENSION when no matchExtension is provided', () => {
  writeEmptyFile(libDir);

  const { files } = findFunctionFiles(libDir);

  expect(files).to.have.lengthOf(1);
});

describe('hasMixedFileTypes', () => {
  it('returns false when only .js files exist', () => {
    writeEmptyFile(libDir, { ext: 'js' });

    const { hasMixedFileTypes } = findFunctionFiles(libDir, matchExtension);

    expect(hasMixedFileTypes).to.equal(false);
  });

  it('returns false when only .ts files exist', () => {
    writeEmptyFile(libDir, { ext: 'ts' });

    const { hasMixedFileTypes } = findFunctionFiles(libDir, matchExtension);

    expect(hasMixedFileTypes).to.equal(false);
  });

  it('returns true when both .js and .ts files exist', () => {
    writeEmptyFile(libDir, { name: 'jsFunc', ext: 'js' });
    writeEmptyFile(libDir, { name: 'tsFunc', ext: 'ts' });

    const { hasMixedFileTypes } = findFunctionFiles(libDir, matchExtension);

    expect(hasMixedFileTypes).to.equal(true);
  });

  it('returns false when no files exist', () => {
    const { hasMixedFileTypes } = findFunctionFiles(libDir, matchExtension);

    expect(hasMixedFileTypes).to.equal(false);
  });
});
