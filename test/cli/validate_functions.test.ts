import { expect } from 'chai';
import { validateFunctions } from '../../src/cli/validate_functions.js';
import { Config } from '../../src/cli/config.js';

describe('validateFunctions()', () => {
  const emptyConfig: Config = {};

  it('returns empty results when files are empty', () => {
    const files: string[] = [];

    const { topLevelKeys, functions } = validateFunctions(files, emptyConfig);

    expect(topLevelKeys).to.have.lengthOf(0);
    expect(functions).to.have.lengthOf(0);
  });

  it('returns correct number of functions', () => {
    const files = ['a/b/c.function.js', 'd/e/f.function.js'];

    const { functions } = validateFunctions(files, emptyConfig);

    expect(functions).to.have.lengthOf(2);
  });

  it('extracts top-level keys from function IDs', () => {
    const files = [
      'events/callable/create.function.js',
      'events/callable/delete.function.js',
      'users/triggers/onCreate.function.js',
    ];

    const { topLevelKeys } = validateFunctions(files, emptyConfig);

    expect(topLevelKeys).to.include.members(['events', 'users']);
    expect(topLevelKeys).to.have.lengthOf(2);
  });

  it('throws error if function ID exceeds character limit', () => {
    const longName = 'a'.repeat(100);
    const files = [`very/long/path/${longName}.function.js`];

    expect(() => validateFunctions(files, emptyConfig)).to.throw(/exceeds the 62 character limit/);
  });

  it('stores unmodified file path in each validated function', () => {
    const file = `a/b/c.function.js`;

    const { functions } = validateFunctions([file], emptyConfig);

    expect(functions[0].filePath).to.equal(file);
  });

  it('throws error on duplicate function IDs', () => {
    const files = new Array(2).fill('messages/callable/sendMessage.function.js');

    expect(() => validateFunctions(files, emptyConfig)).to.throw(/The same function name/);
  });

  for (const [label, file] of [
    ['camelCase', 'events/fsTriggers/onEvent.function.js'],
    ['kebab-case', 'events/fs-triggers/on-event.function.js'],
    ['snake_case', 'events/fs_triggers/on_event.function.js'],
    ['a mix of cases', 'events/fsTriggers/on_event.function.js'],
  ] as const) {
    it(`includes correct export key for ${label} file paths`, () => {
      const { functions } = validateFunctions([file], emptyConfig);

      expect(functions[0].exportKey).to.equal('events.fsTriggers.onEvent');
    });
  }

  it('sets export key equal to function ID for all-lowercase paths', () => {
    const file = 'events/scheduled/clear.function.js';

    const { functions } = validateFunctions([file], emptyConfig);

    expect(functions[0].functionId).to.equal(functions[0].exportKey);
  });
});
