import { expect } from 'chai';
// Self-reference import: resolves through package.json `exports` to the built
// output, exactly as a consumer's ffse.config.js would.
import { defineConfig, type Config } from 'firebase-functions-smart-export';

describe('package entry point', () => {
  it('exposes defineConfig as a named export', () => {
    // Arrange
    const config: Config = { sourceDir: 'src', useSingleQuotes: true };

    // Act
    const result = defineConfig(config);

    // Assert
    expect(result).to.equal(config);
  });
});
