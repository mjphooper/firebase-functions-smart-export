import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { DEFAULT_MATCH_EXTENSION } from '../src/config.js';
import { findFunctionFiles } from '../src/find_function_files.js';
import { useSandbox } from './helpers/sandbox.js';

describe('findFunctionFiles()', () => {
  const sandbox = useSandbox();
  let libDir: string;

  /** Writes an empty file under `libDir` matching `<name>.<matchExtension>.<ext>`. */
  function writeFunctionFile(config?: { ext?: string; name?: string }): void {
    const name = config?.name ?? 'test';
    const ext = (config?.ext ?? 'js').replace(/^\.+/, '');
    fs.writeFileSync(path.join(libDir, `${name}.${DEFAULT_MATCH_EXTENSION}.${ext}`), '');
  }

  beforeEach(() => {
    libDir = path.join(sandbox.path(), 'lib');
    fs.mkdirSync(libDir);
  });

  it('finds a file with the configured extension', () => {
    // Arrange
    writeFunctionFile();

    // Act
    const { files } = findFunctionFiles(libDir, DEFAULT_MATCH_EXTENSION);

    // Assert
    expect(files).to.have.lengthOf(1);
  });

  it('matches a file whose name equals the configured extension', () => {
    // Arrange
    writeFunctionFile({ name: 'function' });

    // Act
    const { files } = findFunctionFiles(libDir, DEFAULT_MATCH_EXTENSION);

    // Assert
    expect(files).to.have.lengthOf(1);
  });

  it('finds matching files in nested directories', () => {
    // Arrange
    const level1 = path.join(libDir, 'level_1');
    const level2 = path.join(level1, 'level_2');
    fs.mkdirSync(level2, { recursive: true });
    writeFunctionFile();
    fs.writeFileSync(path.join(level1, `a.${DEFAULT_MATCH_EXTENSION}.js`), '');
    fs.writeFileSync(path.join(level2, `b.${DEFAULT_MATCH_EXTENSION}.js`), '');

    // Act
    const { files } = findFunctionFiles(libDir, DEFAULT_MATCH_EXTENSION);

    // Assert
    expect(files).to.have.lengthOf(3);
  });

  it('ignores files whose extension does not match', () => {
    // Arrange
    writeFunctionFile({ ext: 'jsx' });
    writeFunctionFile({ ext: 'ts' });
    writeFunctionFile({ ext: 'mjs' });
    writeFunctionFile({ ext: 'js' });

    // Act
    const { files } = findFunctionFiles(libDir, DEFAULT_MATCH_EXTENSION);

    // Assert
    expect(files).to.have.lengthOf(1);
  });

  it('returns an empty list when no files match the extension', () => {
    // Arrange
    writeFunctionFile({ ext: 'txt' });

    // Act
    const { files } = findFunctionFiles(libDir, DEFAULT_MATCH_EXTENSION);

    // Assert
    expect(files).to.have.lengthOf(0);
  });

  it('returns an empty list when the directory is empty', () => {
    const { files } = findFunctionFiles(libDir, DEFAULT_MATCH_EXTENSION);

    expect(files).to.have.lengthOf(0);
  });

  it('does not match files with no name before the extension', () => {
    // Arrange
    writeFunctionFile({ name: '' });

    // Act
    const { files } = findFunctionFiles(libDir, DEFAULT_MATCH_EXTENSION);

    // Assert
    expect(files).to.have.lengthOf(0);
  });

  it('does not match files with extra dots after the extension', () => {
    // Arrange
    writeFunctionFile({ ext: 'js.txt' });
    writeFunctionFile({ ext: 'js.js' });

    // Act
    const { files } = findFunctionFiles(libDir, DEFAULT_MATCH_EXTENSION);

    // Assert
    expect(files).to.have.lengthOf(0);
  });

  it('defaults to DEFAULT_MATCH_EXTENSION when none is provided', () => {
    // Arrange
    writeFunctionFile();

    // Act
    const { files } = findFunctionFiles(libDir);

    // Assert
    expect(files).to.have.lengthOf(1);
  });

  describe('hasMixedFileTypes', () => {
    it('is false when only .js files exist', () => {
      // Arrange
      writeFunctionFile({ ext: 'js' });

      // Act
      const { hasMixedFileTypes } = findFunctionFiles(libDir, DEFAULT_MATCH_EXTENSION);

      // Assert
      expect(hasMixedFileTypes).to.equal(false);
    });

    it('is false when only .ts files exist', () => {
      // Arrange
      writeFunctionFile({ ext: 'ts' });

      // Act
      const { hasMixedFileTypes } = findFunctionFiles(libDir, DEFAULT_MATCH_EXTENSION);

      // Assert
      expect(hasMixedFileTypes).to.equal(false);
    });

    it('is true when both .js and .ts files exist', () => {
      // Arrange
      writeFunctionFile({ name: 'jsFunc', ext: 'js' });
      writeFunctionFile({ name: 'tsFunc', ext: 'ts' });

      // Act
      const { hasMixedFileTypes } = findFunctionFiles(libDir, DEFAULT_MATCH_EXTENSION);

      // Assert
      expect(hasMixedFileTypes).to.equal(true);
    });

    it('is false when no files exist', () => {
      const { hasMixedFileTypes } = findFunctionFiles(libDir, DEFAULT_MATCH_EXTENSION);

      expect(hasMixedFileTypes).to.equal(false);
    });
  });
});
