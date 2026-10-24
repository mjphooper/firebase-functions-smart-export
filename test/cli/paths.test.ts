import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { DEFAULT_OUT_DIR, DEFAULT_SOURCE_DIR } from '../../src/cli/config.js';
import { getAbsSourceDirPath } from '../../src/cli/paths.js';
import { useSandbox } from '../helpers/sandbox.js';

describe('getAbsSourceDirPath()', () => {
  const sandbox = useSandbox();

  /** Creates `dir` inside the sandbox and returns its absolute path. */
  function makeDir(dir: string): string {
    const absPath = path.join(sandbox.path(), dir);
    fs.mkdirSync(absPath, { recursive: true });
    return absPath;
  }

  it('returns the configured sourceDir when it exists', () => {
    // Arrange
    const functionsDir = makeDir('functions');

    // Act
    const result = getAbsSourceDirPath(sandbox.path(), 'functions');

    // Assert
    expect(result).to.equal(functionsDir);
  });

  it('throws when the configured sourceDir does not exist', () => {
    // Arrange
    makeDir(DEFAULT_SOURCE_DIR);

    // Act
    const act = () => getAbsSourceDirPath(sandbox.path(), 'functions');

    // Assert
    expect(act).to.throw('Configured sourceDir "functions" does not exist');
  });

  it(`auto-detects ${DEFAULT_SOURCE_DIR}/ when no sourceDir is configured`, () => {
    // Arrange
    const srcDir = makeDir(DEFAULT_SOURCE_DIR);
    makeDir(DEFAULT_OUT_DIR);

    // Act
    const result = getAbsSourceDirPath(sandbox.path(), undefined);

    // Assert
    expect(result).to.equal(srcDir);
  });

  it(`falls back to ${DEFAULT_OUT_DIR}/ when ${DEFAULT_SOURCE_DIR}/ does not exist`, () => {
    // Arrange
    const libDir = makeDir(DEFAULT_OUT_DIR);

    // Act
    const result = getAbsSourceDirPath(sandbox.path(), undefined);

    // Assert
    expect(result).to.equal(libDir);
  });

  it(`throws when neither ${DEFAULT_SOURCE_DIR}/ nor ${DEFAULT_OUT_DIR}/ exists`, () => {
    // Act
    const act = () => getAbsSourceDirPath(sandbox.path(), undefined);

    // Assert
    expect(act).to.throw('Could not find source directory');
  });
});
