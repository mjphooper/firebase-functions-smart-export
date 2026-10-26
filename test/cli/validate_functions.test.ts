import { expect } from 'chai';
import type { ParsedFunction } from '../../src/cli/parse_function_files.js';
import { FUNCTION_NAME_CHARACTER_LIMIT, validateFunctions } from '../../src/cli/validate_functions.js';

/** Builds a `ParsedFunction`; `filePath` defaults to `<exportKey>.function.js`. */
const makeParsedFunction = (
  exportKey: string,
  filePath = `${exportKey}.function.js`,
): ParsedFunction => ({ exportKey, filePath });

/** An export key one character over the limit. */
const OVERSIZED_KEY = 'x'.repeat(FUNCTION_NAME_CHARACTER_LIMIT + 1);

describe('validateFunctions()', () => {
  it('returns no issues when every function is valid', () => {
    // Arrange
    const functions = [makeParsedFunction('foo'), makeParsedFunction('auth.bar')];

    // Act
    const issues = validateFunctions(functions);

    // Assert
    expect(issues).to.deep.equal([]);
  });

  it('returns no issues for an empty list', () => {
    expect(validateFunctions([])).to.deep.equal([]);
  });

  describe('name length', () => {
    it('flags an export key over the limit', () => {
      // Arrange
      const oversized = makeParsedFunction(OVERSIZED_KEY, 'long.function.js');

      // Act
      const issues = validateFunctions([makeParsedFunction('ok'), oversized]);

      // Assert
      expect(issues).to.have.lengthOf(1);
      expect(issues[0]).to.deep.include({
        type: 'too-long',
        exportKey: OVERSIZED_KEY,
        limit: FUNCTION_NAME_CHARACTER_LIMIT,
        filePaths: ['long.function.js'],
      });
      expect(issues[0].message).to.equal(
        `"${OVERSIZED_KEY}" exceeds the ${FUNCTION_NAME_CHARACTER_LIMIT} character limit for function names.`,
      );
    });

    it('accepts an export key exactly at the limit', () => {
      // Act
      const issues = validateFunctions([makeParsedFunction('x'.repeat(FUNCTION_NAME_CHARACTER_LIMIT))]);

      // Assert
      expect(issues).to.deep.equal([]);
    });

    it('counts group segments and dots towards the limit', () => {
      // Arrange
      const exportKey = `auth.${'x'.repeat(FUNCTION_NAME_CHARACTER_LIMIT - 4)}`;

      // Act
      const issues = validateFunctions([makeParsedFunction(exportKey)]);

      // Assert
      expect(issues.map(issue => issue.type)).to.deep.equal(['too-long']);
    });
  });

  describe('duplicate names', () => {
    it('flags export keys that differ only in case, naming every file', () => {
      // Arrange
      const a = makeParsedFunction('sendMessage', 'a.function.js');
      const b = makeParsedFunction('SendMessage', 'b.function.js');

      // Act
      const issues = validateFunctions([a, b]);

      // Assert
      expect(issues).to.have.lengthOf(1);
      expect(issues[0]).to.deep.include({
        type: 'duplicate-names',
        exportKeys: ['sendMessage', 'SendMessage'],
        filePaths: ['a.function.js', 'b.function.js'],
      });
      expect(issues[0].message).to.contain('Conflicting function names "sendMessage" and "SendMessage".');
      expect(issues[0].message).to.contain('"ffse.config.js"');
    });

    it('flags exact-match collisions', () => {
      // Arrange
      const a = makeParsedFunction('sendMessage', 'a.function.js');
      const b = makeParsedFunction('sendMessage', 'b.function.js');

      // Act
      const issues = validateFunctions([a, b]);

      // Assert
      expect(issues.map(issue => issue.filePaths)).to.deep.equal([['a.function.js', 'b.function.js']]);
    });

    it('reports three or more colliding files as a single issue, listing every name', () => {
      // Arrange
      const a = makeParsedFunction('myFunc', 'a.function.js');
      const b = makeParsedFunction('MYFUNC', 'b.function.js');
      const c = makeParsedFunction('myfunc', 'c.function.js');

      // Act
      const issues = validateFunctions([a, b, c]);

      // Assert
      expect(issues).to.have.lengthOf(1);
      expect(issues[0].filePaths).to.deep.equal(['a.function.js', 'b.function.js', 'c.function.js']);
      expect(issues[0].message).to.contain('Conflicting function names "myFunc", "MYFUNC" and "myfunc".');
    });

    it('reports one issue per independent collision group', () => {
      // Arrange
      const a1 = makeParsedFunction('one', 'a1.function.js');
      const a2 = makeParsedFunction('ONE', 'a2.function.js');
      const b1 = makeParsedFunction('two', 'b1.function.js');
      const b2 = makeParsedFunction('TWO', 'b2.function.js');
      const unique = makeParsedFunction('three', 'three.function.js');

      // Act
      const issues = validateFunctions([a1, b1, a2, unique, b2]);

      // Assert
      expect(issues.map(issue => issue.filePaths)).to.have.deep.members([
        ['a1.function.js', 'a2.function.js'],
        ['b1.function.js', 'b2.function.js'],
      ]);
    });
  });

  describe('reporting', () => {
    it('reports per-function issues first, then collisions', () => {
      // Arrange
      const longA = makeParsedFunction(OVERSIZED_KEY, 'longA.function.js');
      const longB = makeParsedFunction(`y${OVERSIZED_KEY}`, 'longB.function.js');
      const dupA = makeParsedFunction('foo', 'auth/foo.function.js');
      const dupB = makeParsedFunction('foo', 'chats/foo.function.js');

      // Act
      const issues = validateFunctions([longA, dupA, longB, dupB]);

      // Assert
      expect(issues.map(issue => issue.filePaths)).to.deep.equal([
        ['longA.function.js'],
        ['longB.function.js'],
        ['auth/foo.function.js', 'chats/foo.function.js'],
      ]);
    });

    it('runs the duplicate check on functions that also fail the length check', () => {
      // Arrange
      const a = makeParsedFunction(OVERSIZED_KEY, 'a.function.js');
      const b = makeParsedFunction(OVERSIZED_KEY, 'b.function.js');

      // Act
      const issues = validateFunctions([a, b]);

      // Assert
      expect(issues.map(issue => issue.type)).to.deep.equal(['too-long', 'too-long', 'duplicate-names']);
    });

  });
});
