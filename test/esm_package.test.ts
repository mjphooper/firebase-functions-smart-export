import { expect } from 'chai';
import fs from 'fs';
import { resolve } from 'path';
import { isEsmPackage } from '../src/esm_package.js';
import { useSandbox } from './helpers/sandbox.js';

describe('isEsmPackage()', () => {
  const sandbox = useSandbox();

  function writePackageJson(fields: Record<string, unknown>): void {
    fs.writeFileSync(resolve(sandbox.path(), 'package.json'), JSON.stringify(fields));
  }

  it('returns true when package.json sets "type": "module"', () => {
    // Arrange
    writePackageJson({ type: 'module' });

    // Act
    const result = isEsmPackage(sandbox.path());

    // Assert
    expect(result).to.equal(true);
  });

  it('returns false when package.json sets "type": "commonjs"', () => {
    // Arrange
    writePackageJson({ type: 'commonjs' });

    // Act
    const result = isEsmPackage(sandbox.path());

    // Assert
    expect(result).to.equal(false);
  });

  it('returns false when package.json sets no type', () => {
    // Arrange
    writePackageJson({ main: 'lib/index.js' });

    // Act
    const result = isEsmPackage(sandbox.path());

    // Assert
    expect(result).to.equal(false);
  });

  it('returns false when there is no package.json', () => {
    // Act
    const result = isEsmPackage(sandbox.path());

    // Assert
    expect(result).to.equal(false);
  });
});
