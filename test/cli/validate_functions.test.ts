import { validateFunctions } from '../../src/cli/validate_functions.js';
import { Config } from '../../src/shared/types/config.js';

describe('validateFunctions()', () => {
  const emptyConfig: Config = {};

  test('returns empty results when files are empty', () => {
    // Arrange
    const files: string[] = [];

    // Act
    const { topLevelKeys, functions } = validateFunctions(files, emptyConfig);

    // Assert
    expect(topLevelKeys).toHaveLength(0);
    expect(functions).toHaveLength(0);
  });

  test('returns correct number of functions', () => {
    // Arrange
    const files = ['a/b/c.function.js', 'd/e/f.function.js'];

    // Act
    const { functions } = validateFunctions(files, emptyConfig);

    // Assert
    expect(functions).toHaveLength(2);
  });

  test('extracts top-level keys from function IDs', () => {
    // Arrange
    const files = [
      'events/callable/create.function.js',
      'events/callable/delete.function.js',
      'users/triggers/onCreate.function.js',
    ];

    // Act
    const { topLevelKeys } = validateFunctions(files, emptyConfig);

    // Assert
    expect(topLevelKeys).toEqual(expect.arrayContaining(['events', 'users']));
    expect(topLevelKeys).toHaveLength(2);
  });

  test('throws error if function ID exceeds character limit', () => {
    // Arrange
    const longName = 'a'.repeat(100);
    const files = [`very/long/path/${longName}.function.js`];

    // Act & Assert
    expect(() => validateFunctions(files, emptyConfig)).toThrow(
      /exceeds the 62 character limit/
    );
  });

  test('stores unmodified file path in each validated function', () => {
    // Arrange
    const file = `a/b/c.function.js`;

    // Act
    const { functions } = validateFunctions([file], emptyConfig);

    // Assert
    expect(functions[0].filePath).toBe(file);
  });

  test('throws error on duplicate function IDs', () => {
    // Arrange
    const files = new Array(2).fill('messages/callable/sendMessage.function.js');

    // Act & Assert
    expect(() => validateFunctions(files, emptyConfig)).toThrow(
      /The same function name/
    );
  });

  test.each([
    ['camelCase', 'events/fsTriggers/onEvent.function.js'],
    ['kebab-case', 'events/fs-triggers/on-event.function.js'],
    ['snake_case', 'events/fs_triggers/on_event.function.js'],
    ['a mix of cases', 'events/fsTriggers/on_event.function.js'],
  ])('includes correct export key for %s file paths', (_, file) => {
    // Act
    const { functions } = validateFunctions([file], emptyConfig);

    // Assert
    expect(functions[0].exportKey).toBe('events.fsTriggers.onEvent');
  });

  test('sets export key equal to function ID for all-lowercase paths', () => {
    // Arrange
    const file = 'events/scheduled/clear.function.js';

    // Act
    const { functions } = validateFunctions([file], emptyConfig);

    // Assert
    expect(functions[0].functionId).toBe(functions[0].exportKey);
  });
});
