import { expect } from 'chai';
import fs from 'fs';
import { resolve } from 'path';
import { detectProjectLanguage } from '../src/project_language.js';
import { useSandbox } from './helpers/sandbox.js';

describe('detectProjectLanguage()', () => {
  const sandbox = useSandbox();

  function writeIndex(fileName: string): void {
    fs.writeFileSync(resolve(sandbox.path(), fileName), `export * from './index.gen.js';\n`);
  }

  it('returns ts when the source directory holds index.ts', () => {
    // Arrange
    writeIndex('index.ts');

    // Act
    const language = detectProjectLanguage(sandbox.path());

    // Assert
    expect(language).to.equal('ts');
  });

  it('returns js when the source directory holds index.js', () => {
    // Arrange
    writeIndex('index.js');

    // Act
    const language = detectProjectLanguage(sandbox.path());

    // Assert
    expect(language).to.equal('js');
  });

  it('prefers ts when the source directory holds both', () => {
    // Arrange
    writeIndex('index.ts');
    writeIndex('index.js');

    // Act
    const language = detectProjectLanguage(sandbox.path());

    // Assert
    expect(language).to.equal('ts');
  });

  it('throws naming both files when the source directory holds neither', () => {
    // Act
    const detect = () => detectProjectLanguage(sandbox.path());

    // Assert
    expect(detect).to.throw(/Could not find index\.ts or index\.js/);
  });
});
