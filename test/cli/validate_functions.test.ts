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
    const functions = [makeParsedFunction('foo'), makeParsedFunction('auth.bar'), makeParsedFunction('v2.thing')];

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

  describe('reserved words', () => {
    it('flags a reserved top-level name, naming the word and how to fix it', () => {
      // Arrange
      const reserved = makeParsedFunction('delete.thing', 'delete/thing.function.js');

      // Act
      const issues = validateFunctions([reserved]);

      // Assert
      expect(issues).to.have.lengthOf(1);
      expect(issues[0]).to.deep.include({
        type: 'reserved-word',
        exportKey: 'delete.thing',
        word: 'delete',
        filePaths: ['delete/thing.function.js'],
      });
      expect(issues[0].message).to.contain('"delete.thing" can\'t be exported');
      expect(issues[0].message).to.contain('"delete" is a reserved word in JavaScript');
      expect(issues[0].message).to.contain('"ffse.config.js"');
    });

    it('flags strict-mode, module-only, literal and strict-binding words', () => {
      // Arrange
      const functions = ['package.publish', 'await', 'null.check', 'eval.run'].map(key => makeParsedFunction(key));

      // Act
      const issues = validateFunctions(functions);

      // Assert
      expect(issues.map(issue => issue.type === 'reserved-word' && issue.word)).to.deep.equal([
        'package',
        'await',
        'null',
        'eval',
      ]);
    });

    it('accepts reserved words in nested segments', () => {
      // Act
      const issues = validateFunctions([makeParsedFunction('users.delete'), makeParsedFunction('v2.class.new')]);

      // Assert
      expect(issues).to.deep.equal([]);
    });

    it('accepts names that only contain a reserved word', () => {
      // Act
      const issues = validateFunctions([makeParsedFunction('deleteUser'), makeParsedFunction('classes')]);

      // Assert
      expect(issues).to.deep.equal([]);
    });
  });

  describe('leading character', () => {
    it('flags a name that starts with a digit', () => {
      // Arrange
      const leadingDigit = makeParsedFunction('2fa.verify', '2fa/verify.function.js');

      // Act
      const issues = validateFunctions([leadingDigit]);

      // Assert
      expect(issues).to.have.lengthOf(1);
      expect(issues[0]).to.deep.include({
        type: 'leading-non-letter',
        exportKey: '2fa.verify',
        filePaths: ['2fa/verify.function.js'],
      });
      expect(issues[0].message).to.contain('"2fa.verify" must start with a letter');
      expect(issues[0].message).to.contain('"ffse.config.js"');
    });

    it('accepts nested segments that start with a digit and names that start with a capital', () => {
      // Act
      const issues = validateFunctions([makeParsedFunction('v2.2fa'), makeParsedFunction('Auth.x')]);

      // Assert
      expect(issues).to.deep.equal([]);
    });
  });

  describe('allowed characters', () => {
    it('flags non-ASCII letters in any segment, saying what is allowed', () => {
      // Arrange
      const accented = makeParsedFunction('café.order', 'café/order.function.js');
      const cjk = makeParsedFunction('orders.日本', 'orders/日本.function.js');

      // Act
      const issues = validateFunctions([accented, cjk]);

      // Assert
      expect(issues.map(issue => issue.type)).to.deep.equal(['invalid-characters', 'invalid-characters']);
      expect(issues.map(issue => issue.filePaths)).to.deep.equal([
        ['café/order.function.js'],
        ['orders/日本.function.js'],
      ]);
      expect(issues[0].message).to.contain('"café.order" contains characters that can\'t be used in a function name');
      expect(issues[0].message).to.contain('only ASCII letters and digits');
    });

    it('flags an empty segment in the middle or at the end', () => {
      // Act
      const issues = validateFunctions([makeParsedFunction('a..foo'), makeParsedFunction('a.')]);

      // Assert
      expect(issues.map(issue => issue.type)).to.deep.equal(['invalid-characters', 'invalid-characters']);
    });

    it('accepts ASCII letters and digits in every segment', () => {
      // Act
      const issues = validateFunctions([makeParsedFunction('v2.sendMessage2'), makeParsedFunction('a')]);

      // Assert
      expect(issues).to.deep.equal([]);
    });
  });

  describe('reporting', () => {
    it('reports per-function issues in check order, then collisions', () => {
      // Arrange
      const longA = makeParsedFunction(OVERSIZED_KEY, 'longA.function.js');
      const longB = makeParsedFunction(`y${OVERSIZED_KEY}`, 'longB.function.js');
      const dupA = makeParsedFunction('foo', 'auth/foo.function.js');
      const dupB = makeParsedFunction('foo', 'chats/foo.function.js');
      const reserved = makeParsedFunction('delete.thing', 'delete/thing.function.js');
      const leadingDigit = makeParsedFunction('2fa.verify', '2fa/verify.function.js');

      // Act
      const issues = validateFunctions([longA, reserved, dupA, longB, leadingDigit, dupB]);

      // Assert
      expect(issues.map(issue => issue.type)).to.deep.equal([
        'too-long',
        'too-long',
        'reserved-word',
        'leading-non-letter',
        'duplicate-names',
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

    it('reports every rule a single function breaks', () => {
      // Act
      const issues = validateFunctions([makeParsedFunction('.verify', '_/verify.function.js')]);

      // Assert
      expect(issues.map(issue => issue.type)).to.deep.equal(['leading-non-letter', 'invalid-characters']);
    });
  });
});
