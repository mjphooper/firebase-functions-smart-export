// test/transform_groups.test.ts

import { transformGroups } from "../../../src/cli/function_registry/transform_groups.js";
import { Config } from "../../../src/shared/types/config.js";



test('has no effect when the config is empty', () => {
  // Arrange
  const config: Config = {};

  // Act
  const result = transformGroups(['foo', 'bar'], config);

  // Assert
  expect(result).toEqual(['foo', 'bar']);
});

describe('when ignored groups are given', () => {

  test('removes ignored groups', () => {
    // Arrange
    const config: Config = { ignoreGroups: ['ignored'] };

    // Act
    const result = transformGroups(['foo', 'ignored', 'bar'], config);

    // Assert
    expect(result).toEqual(['foo', 'bar']);
  });

  test('has no effect when the `ignoreGroups` array is empty', () => {
    // Arrange
    const config: Config = { ignoreGroups: [] };

    // Act
    const result = transformGroups(['foo', 'ignored', 'bar'], config);

    // Assert
    expect(result).toEqual(['foo', 'ignored', 'bar']);
  })
});

describe('when a group mapping function is provided', () => {
  test('applies the group mapping function', () => {
    // Arrange
    const config: Config = { mapGroups: groups => groups.map(g => g + '_mapped') };

    // Act
    const result = transformGroups(['a', 'b'], config);

    // Assert
    expect(result).toEqual(['a_mapped', 'b_mapped']);
  });

  test('applies the group mapping function last', () => {
    // Arrange
    const groups = ['a', 'b', 'c', 'd'];
    const config: Config = {
      ignoreGroups: ['a', 'b'],
      maxGroupDepth: 1,
      mapGroups: groups => groups.map(g => g + '_mapped'),
    };

    // Act
    const result = transformGroups(groups, config);

    // Assert
    expect(result).toEqual(['c_mapped']);
  });
});

describe('when a max group depth is set', () => {

  test('limits group depth', () => {
    // Arrange
    const groups = ['a', 'b', 'c'];
    const config: Config = { maxGroupDepth: 1 };

    // Act
    const result = transformGroups(groups, config);

    // Assert
    expect(result).toEqual(['a'])
  });

  test.each([
    0,
    -10,
    -Number.MAX_SAFE_INTEGER,
  ])('throws when the max depth is set to %s', (maxDepth) => {
    // Arrange
    const config: Config = { maxGroupDepth: maxDepth };

    // Act & Assert
    expect(() => transformGroups([], config)).toThrow();
  });
});

describe('when groups are disabled', () => {

  test('returns an empty array', () => {
    // Arrange
    const groups = ['a', 'b', 'c'];
    const config: Config = {
      disableGroups: true,
      ignoreGroups: ['a'],
      maxGroupDepth: 1,
    };

    // Act
    const result = transformGroups(groups, config);

    // Assert
    expect(result).toHaveLength(0);
  });

});
