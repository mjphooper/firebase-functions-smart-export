import { calculateRegistrySize } from '../../src/shared/calculate_registry_size.js';
import { FunctionReference, FunctionRegistry } from "../../src/shared/types/function_registry.js";


describe('registrySize', () => {

  const emptyReference: FunctionReference = ['', ''];

  test('returns 0 for empty registry', () => {
    // Act
    const result = calculateRegistrySize({});

    // Assert
    expect(result).toBe(0);
  });

  test('returns 1 for single function reference', () => {
    // Arrange
    const registry: FunctionRegistry = {
      'id': ['path/to/id.function.js'],
    };

    // Act
    const result = calculateRegistrySize(registry);

    // Assert
    expect(result).toBe(1);
  });

  test('counts multiple nested function references', () => {
    // Arrange
    const registry: FunctionRegistry = {
      level_1: {
        fn_1: emptyReference,
      },
      level_2: {
        fn_2: emptyReference,
        level_3: {
          fn_3: emptyReference,
        },
      },
    };

    // Act
    const result = calculateRegistrySize(registry);

    // Assert
    expect(result).toBe(3);
  });
});

