import { expect } from 'chai';
import { parseFunctionFile } from '../src/parse_function_files.js';
import type { Config } from '../src/config.js';

describe('parseFunctionFile()', () => {
  const emptyConfig: Config = {};

  it('stores the unmodified file path on the parsed function', () => {
    // Arrange
    const file = `a/b/c.function.js`;

    // Act
    const result = parseFunctionFile(file, emptyConfig);

    // Assert
    expect(result.filePath).to.equal(file);
  });

  it('transforms a lowercase path to an export key', () => {
    expect(parseFunctionFile('a/b/c.function.js', emptyConfig).exportKey).to.equal('a.b.c');
  });

  for (const [label, file] of [
    ['camelCase', 'events/fsTriggers/onEvent.function.js'],
    ['kebab-case', 'events/fs-triggers/on-event.function.js'],
    ['snake_case', 'events/fs_triggers/on_event.function.js'],
    ['a mix of cases', 'events/fsTriggers/on_event.function.js'],
  ] as const) {
    it(`derives the correct export key from ${label} file paths`, () => {
      expect(parseFunctionFile(file, emptyConfig).exportKey).to.equal('events.fsTriggers.onEvent');
    });
  }

  it('applies group transforms from config', () => {
    // Arrange
    const config: Config = { ignoreGroups: ['redundant', 'yawn'] };

    // Act
    const result = parseFunctionFile('redundant/path/to/file/yawn/someFunction.function.js', config);

    // Assert
    expect(result.exportKey).to.equal('path.to.file.someFunction');
  });

  describe('when file extension is wrong', () => {
    it('throws if file extension is missing', () => {
      expect(() => parseFunctionFile('foo/bar', emptyConfig)).to.throw();
    });

    it('throws if the file does not use .js', () => {
      expect(() => parseFunctionFile('foo/bar.function.ts', emptyConfig)).to.throw();
    });

    it('throws if the file extension is the wrong format', () => {
      expect(() => parseFunctionFile('foo/bar.js.function', emptyConfig)).to.throw();
    });
  });

  describe('given a Windows-style path', () => {
    it('handles Windows-style backslash paths', () => {
      expect(parseFunctionFile('group\\subgroup\\func.function.js', emptyConfig).exportKey).to.equal('group.subgroup.func');
    });

    it('handles mixed slash styles', () => {
      expect(parseFunctionFile('group/subgroup\\func.function.js', emptyConfig).exportKey).to.equal('group.subgroup.func');
    });
  });
});
