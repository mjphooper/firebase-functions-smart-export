import { flattenFunctionRegistry } from "../../src/shared/flatten_function_registry.js";
import { FunctionReference, FunctionRegistry } from "../../src/shared/types/function_registry.js";

;

const emptyReference: FunctionReference = [''];

it('returns an already flat registry with a single item as-is', () => {
  // Arrange
  const registry: FunctionRegistry = {
    foo: emptyReference,
  };

  // Act
  const result = flattenFunctionRegistry(registry);

  // Assert
  expect(result).toEqual({ 'foo': emptyReference });
});

it('returns an already flat registry with multiple items as-is', () => {
  // Arrange
  const registry: FunctionRegistry = {
    foo: emptyReference,
    bar: emptyReference,
  };

  // Act
  const result = flattenFunctionRegistry(registry);

  // Assert
  expect(result).toEqual({ 'foo': emptyReference, 'bar': emptyReference });
});

it('flattens a nested registry', () => {
  // Arrange
  const registry: FunctionRegistry = {
    foo: { bar: emptyReference },
  };

  // Act
  const result = flattenFunctionRegistry(registry);

  // Assert
  expect(result).toEqual({ 'foo.bar': emptyReference });
});

it('flattens a deeply nested registry', () => {
  // Arrange
  const registry: FunctionRegistry = {
    foo: {
      bar: {
        baz: emptyReference,
      },
    },
  };

  // Act
  const result = flattenFunctionRegistry(registry);

  // Assert
  expect(result).toEqual({
    'foo.bar.baz': emptyReference,
  });
});

it('flattens a mixed-depth registry', () => {
  // Arrange
  const registry: FunctionRegistry = {
    foo: {
      bar: {
        function: emptyReference,
      },
    },
    baz: {
      function: emptyReference,
    }
  };

  // Act
  const result = flattenFunctionRegistry(registry);

  // Assert
  expect(result).toEqual({
    'foo.bar.function': emptyReference,
    'baz.function': emptyReference,
  });
});


it('returns an empty object when given an empty registry', () => {
  // Act
  const result = flattenFunctionRegistry({});

  // Assert
  expect(result).toEqual({});
});
