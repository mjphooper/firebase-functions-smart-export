import { expect } from 'chai';
import { findDuplicateFunctions, findOversizedFunctions, parseFunctionFile, type ParsedFunction } from '../../src/cli/parse_function_files.js';
import { Config } from '../../src/cli/config.js';

/** Builds a `ParsedFunction`; `filePath` defaults to `<exportKey>.function.js`. */
const makeParsedFunction = (
  exportKey: string,
  filePath = `${exportKey}.function.js`,
): ParsedFunction => ({ exportKey, filePath });

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

describe('findOversizedFunctions()', () => {
  it('returns an empty list when all keys are within the limit', () => {
    // Act
    const result = findOversizedFunctions([makeParsedFunction('foo'), makeParsedFunction('bar')], 10);

    // Assert
    expect(result).to.have.lengthOf(0);
  });

  it('returns only the functions whose export key exceeds the limit', () => {
    // Arrange
    const small = makeParsedFunction('ok');
    const large = makeParsedFunction('x'.repeat(20));

    // Act
    const result = findOversizedFunctions([small, large], 10);

    // Assert
    expect(result).to.deep.equal([large]);
  });

  it('treats keys exactly at the limit as valid', () => {
    // Arrange
    const exact = makeParsedFunction('x'.repeat(10));

    // Act
    const result = findOversizedFunctions([exact], 10);

    // Assert
    expect(result).to.have.lengthOf(0);
  });
});

describe('findDuplicateFunctions()', () => {
  it('returns no groups when all export keys are unique', () => {
    // Act
    const groups = findDuplicateFunctions([makeParsedFunction('foo'), makeParsedFunction('bar'), makeParsedFunction('baz')]);

    // Assert
    expect(groups).to.have.lengthOf(0);
  });

  it('returns no groups for an empty list', () => {
    expect(findDuplicateFunctions([])).to.have.lengthOf(0);
  });

  it('groups exact-match collisions', () => {
    // Arrange
    const a = makeParsedFunction('sendMessage', 'a.function.js');
    const b = makeParsedFunction('sendMessage', 'b.function.js');

    // Act
    const groups = findDuplicateFunctions([a, b]);

    // Assert
    expect(groups).to.deep.equal([[a, b]]);
  });

  it('groups case-only collisions', () => {
    // Arrange
    const a = makeParsedFunction('sendMessage', 'a.function.js');
    const b = makeParsedFunction('sendmessage', 'b.function.js');

    // Act
    const groups = findDuplicateFunctions([a, b]);

    // Assert
    expect(groups).to.deep.equal([[a, b]]);
  });

  it('returns groups of three or more when multiple files collide', () => {
    // Arrange
    const a = makeParsedFunction('myFunc', 'a.function.js');
    const b = makeParsedFunction('MYFUNC', 'b.function.js');
    const c = makeParsedFunction('myfunc', 'c.function.js');

    // Act
    const groups = findDuplicateFunctions([a, b, c]);

    // Assert
    expect(groups).to.deep.equal([[a, b, c]]);
  });

  it('reports multiple independent collision groups', () => {
    // Arrange
    const a1 = makeParsedFunction('one', 'a1.function.js');
    const a2 = makeParsedFunction('ONE', 'a2.function.js');
    const b1 = makeParsedFunction('two', 'b1.function.js');
    const b2 = makeParsedFunction('TWO', 'b2.function.js');
    const unique = makeParsedFunction('three', 'three.function.js');

    // Act
    const groups = findDuplicateFunctions([a1, b1, a2, unique, b2]);

    // Assert
    expect(groups).to.have.lengthOf(2);
    expect(groups).to.deep.include([a1, a2]);
    expect(groups).to.deep.include([b1, b2]);
  });
});
