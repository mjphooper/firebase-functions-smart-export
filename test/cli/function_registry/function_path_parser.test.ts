// test/function_path_parser.test.ts

import { parseExportKeyFromPath, parseFunctionIdFromPath } from "../../../src/cli/function_registry/function_path_parser.js";
import { Config } from "../../../src/shared/types/config.js";



describe('parseExportKeyFromPath()', () => {
  const emptyConfig: Config = {};

  test('transforms a lowercase path to an export key', () => {
    const path = 'a/b/c.function.js';
    const result = parseExportKeyFromPath(path, emptyConfig);
    expect(result).toBe('a.b.c');
  });

  test.each([
    ['camelCase', 'events/fsTriggers/onEvent.function.js'],
    ['kebab-case', 'events/fs-triggers/on-event.function.js'],
    ['snake_case', 'events/fs_triggers/on_event.function.js'],
    ['a mix of cases', 'events/fsTriggers/on_event.function.js'],
  ])('transform %s path to a camelCase export key', (_, path) => {
    const result = parseExportKeyFromPath(path, emptyConfig);
    expect(result).toBe('events.fsTriggers.onEvent');
  });

  test('applies group transforms from config', () => {
    const path = 'redundant/path/to/file/yawn/someFunction.function.js';
    const groupTransformingConfig: Config = {
      ignoreGroups: ['redundant', 'yawn'],
    };
    const result = parseExportKeyFromPath(path, groupTransformingConfig);
    expect(result).toBe('path.to.file.someFunction');
  });

  describe('when file extension is wrong', () => {
    test('throws if file extension is missing', () => {
      const path = 'foo/bar';
      expect(() => parseExportKeyFromPath(path, emptyConfig)).toThrow();
    });

    test('throws if the file does not use .js', () => {
      const path = 'foo/bar.function.ts'
      expect(() => parseExportKeyFromPath(path, emptyConfig)).toThrow();
    });

    test('throws if the file extension is the wrong format', () => {
      const path = 'foo/bar.js.function';
      expect(() => parseExportKeyFromPath(path, emptyConfig)).toThrow();
    });
  });
});

describe('parseFunctionIdFromPath()', () => {
  test('returns a lowercase function ID', () => {
    const path = 'primaryGroup/subGroup/myFunction.function.js';
    const result = parseFunctionIdFromPath(path, {});
    expect(result).toBe('primarygroup.subgroup.myfunction');
  });
});