import { expect } from 'chai';
import type { ParsedFunction } from '../../src/cli/parse_function_files.js';
import {
  findDuplicateFunctions,
  findOversizedFunctions,
  FUNCTION_NAME_CHARACTER_LIMIT,
  validateFunctions,
} from '../../src/cli/validate_functions.js';

/** Builds a `ParsedFunction`; `filePath` defaults to `<exportKey>.function.js`. */
const makeParsedFunction = (
  exportKey: string,
  filePath = `${exportKey}.function.js`,
): ParsedFunction => ({ exportKey, filePath });

/** An export key one character over the limit. */
const OVERSIZED_KEY = 'x'.repeat(FUNCTION_NAME_CHARACTER_LIMIT + 1);

describe('validateFunctions()', () => {
  it('returns no errors when every function is valid', () => {
    // Arrange
    const functions = [makeParsedFunction('foo'), makeParsedFunction('auth.bar')];

    // Act
    const errors = validateFunctions(functions);

    // Assert
    expect(errors).to.deep.equal([]);
  });

  it('returns one error naming the file when an export key is over the limit', () => {
    // Arrange
    const oversized = makeParsedFunction(OVERSIZED_KEY, 'long.function.js');

    // Act
    const errors = validateFunctions([makeParsedFunction('ok'), oversized]);

    // Assert
    expect(errors).to.have.lengthOf(1);
    expect(errors[0].message).to.contain(`exceeds the ${FUNCTION_NAME_CHARACTER_LIMIT} character limit`);
    expect(errors[0].filePaths).to.deep.equal(['long.function.js']);
  });

  it('returns one error naming every colliding file when export keys conflict', () => {
    // Arrange
    const a = makeParsedFunction('sendMessage', 'a.function.js');
    const b = makeParsedFunction('SendMessage', 'b.function.js');

    // Act
    const errors = validateFunctions([a, b]);

    // Assert
    expect(errors).to.have.lengthOf(1);
    expect(errors[0].message).to.contain('Conflicting function names');
    expect(errors[0].message).to.contain('"ffse.config.js"');
    expect(errors[0].filePaths).to.deep.equal(['a.function.js', 'b.function.js']);
  });

  it('reports every problem when several checks fail at once', () => {
    // Arrange
    const longA = makeParsedFunction(OVERSIZED_KEY, 'longA.function.js');
    const longB = makeParsedFunction(`y${OVERSIZED_KEY}`, 'longB.function.js');
    const dupA = makeParsedFunction('foo', 'auth/foo.function.js');
    const dupB = makeParsedFunction('foo', 'chats/foo.function.js');

    // Act
    const errors = validateFunctions([longA, dupA, longB, dupB]);

    // Assert
    expect(errors.map(error => error.filePaths)).to.deep.equal([
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
    const errors = validateFunctions([a, b]);

    // Assert
    expect(errors).to.have.lengthOf(3);
    expect(errors[2].message).to.contain('Conflicting function names');
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
