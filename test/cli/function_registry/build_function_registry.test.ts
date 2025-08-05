import dlv from 'dlv';
import { buildFunctionRegistry } from '../../../src/cli/function_registry/build_function_registry.js';
import { calculateRegistrySize } from '../../../src/shared/calculate_registry_size.js';
import { Config } from '../../../src/shared/types/config.js';
import { FunctionReference, FunctionRegistry } from '../../../src/shared/types/function_registry.js';

describe('build_function_registry.ts', () => {
  const emptyConfig: Config = {};

  test('builds empty registry when files are empty', () => {
    // Arrange
    const files: string[] = [];

    // Act
    const registry = buildFunctionRegistry(files, emptyConfig);

    // Assert
    expect(calculateRegistrySize(registry)).toBe(0);
  });

  test('builds registry of correct size', () => {
    // Arrange
    const files = ['a/b/c.function.js', 'd/e/f.function.js'];

    // Act
    const registry = buildFunctionRegistry(files, emptyConfig);

    // Assert 
    expect(calculateRegistrySize(registry)).toBe(2);
  });

  test('maps file path to registry key path correctly', () => {
    // Arrange
    const file = 'a/b/c.function.js';

    // Act
    const registry = buildFunctionRegistry([file], emptyConfig);

    // Assert 
    expect(registry).toEqual({
      a: {
        b: {
          c: [file],
        }
      }
    });
  });

  test('throws error if function ID exceeds character limit', () => {
    // Arrange
    const longName = 'a'.repeat(100);
    const files = [`very/long/path/${longName}.function.js`];

    // Act & Assert
    expect(() => buildFunctionRegistry(files, emptyConfig)).toThrow(
      /exceeds the 62 character limit/
    );
  });
  test('stores unmodified file path in each reference', () => {
    // Arrange
    const file = `a/b/c.function.js`;

    // Act
    const registry = buildFunctionRegistry([file], emptyConfig);
    const reference = dlv(registry, 'a.b.c');

    // Assert
    expect(reference[0]).toBe(file);
  });


  test('throws error on duplicate function IDs', () => {
    // Arrange
    const files = new Array(2).fill('messages/callable/sendMessage.function.js');

    // Act & Assert
    expect(() => buildFunctionRegistry(files, emptyConfig)).toThrow(
      /The same function name/
    );
  });

  test.each([
    ['camelCase', 'events/fsTriggers/onEvent.function.js'],
    ['kebab-case', 'events/fs-triggers/on-event.function.js'],
    ['snake_case', 'events/fs_triggers/on_event.function.js'],
    ['a mix of cases', 'events/fsTriggers/on_event.function.js'],
  ])('includes export key if file path uses %s', (_, file) => {
    // Act
    const registry = buildFunctionRegistry([file], emptyConfig);
    const reference = dlv(registry, 'events.fstriggers.onevent');

    // Assert
    expect(reference[1]).toBeTruthy();
  });


  test('omits export key if file path is all lowercase', () => {
    // Arrange
    const file = 'events/scheduled/clear.function.js';

    // Act
    const registry: FunctionRegistry = buildFunctionRegistry([file], emptyConfig);
    const reference: FunctionReference = dlv(registry, 'events.scheduled.clear');

    // Assert
    expect(reference[1]).toBeFalsy();
  });
});