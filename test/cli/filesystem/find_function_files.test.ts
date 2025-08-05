import * as fs from 'fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as path from 'path';
import { DEFAULT_MATCH_EXTENSION } from '../../../src/cli/constants/default_match_extension.js';
import { findFunctionFiles } from '../../../src/cli/filesystem/find_function_files.js';

const __dirname = dirname(fileURLToPath(import.meta.url));


const tempFixturesDir = path.resolve(__dirname, '../temp_fixtures');
const libDir = path.join(tempFixturesDir, 'lib');

const matchExtension = DEFAULT_MATCH_EXTENSION;

/**
 * Writes an empty file in the given directory with the `matchExtension`.
 * @param dir - An existing directory in which to create the file.
 * @param config - Optional configuration of the file to create.
 * @throws If the directory does not exist.
 */
function writeEmptyFile(dir: string, config?: {
  /**
   * The extension of the file. The leading `.` may be omitted.
   * 
   * Defaults to `js`.
   */
  ext?: string,

  /**
   * The name of the file.
   * 
   * Defaults to `test`.
   */
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


test('finds single file matching extension', () => {
  // Arrange
  writeEmptyFile(libDir);

  // Act
  const files = findFunctionFiles(libDir, matchExtension);

  // Assert
  expect(files).toHaveLength(1);
});

test('matches file with same name as matchExtension', () => {
  // Arrange
  writeEmptyFile(libDir, { name: 'function' });

  // Act
  const files = findFunctionFiles(libDir, matchExtension);

  // Assert
  expect(files).toHaveLength(1);
});

test('finds nested files matching extension', () => {
  // Arrange
  const level1 = path.join(libDir, 'level_1');
  const level2 = path.join(level1, 'level_2');
  fs.mkdirSync(level1);
  fs.mkdirSync(level2);
  writeEmptyFile(libDir);
  writeEmptyFile(level1);
  writeEmptyFile(level2);

  // Act
  const files = findFunctionFiles(libDir, matchExtension);

  // Assert
  expect(files).toHaveLength(3);
});


test('ignores files not matching extension', () => {
  // Arrange
  writeEmptyFile(libDir, { ext: 'jsx' });
  writeEmptyFile(libDir, { ext: 'ts' });
  writeEmptyFile(libDir, { ext: 'mjs' });
  writeEmptyFile(libDir, { ext: 'js' });

  // Act
  const files = findFunctionFiles(libDir, matchExtension);

  // Assert
  expect(files).toHaveLength(1);
});

test('returns empty list when no files match extension', () => {
  // Arrange
  writeEmptyFile(libDir, { ext: 'txt' });

  // Act
  const files = findFunctionFiles(libDir, matchExtension);

  // Assert
  expect(files).toHaveLength(0);
});

test('returns empty list when no files exist', () => {
  // Act
  const files = findFunctionFiles(libDir, matchExtension);

  // Assert
  expect(files).toHaveLength(0);
});


test('does not match files with identifier but no name', () => {
  // Arrange
  writeEmptyFile(libDir, { name: '' });

  // Act
  const files = findFunctionFiles(libDir, matchExtension);

  // Assert
  expect(files).toHaveLength(0);
});

test('does not match files with extra dots after .function.js', () => {
  // Arrange
  writeEmptyFile(libDir, { ext: 'js.txt' });
  writeEmptyFile(libDir, { ext: 'js.js' });

  // Act
  const files = findFunctionFiles(libDir, matchExtension);

  // Assert
  expect(files).toHaveLength(0);
});

test('uses DEFAULT_MATCH_EXTENSION when no matchExtension is provided', () => {
  // Arrange
  writeEmptyFile(libDir);

  // Act
  const files = findFunctionFiles(libDir);

  // Assert
  expect(files).toHaveLength(1);
});
