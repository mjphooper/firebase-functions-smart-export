import { expect } from 'chai';
import { parseExportKeyFromPath, parseFunctionIdFromPath } from "../../src/shared/function_path_parser.js";
import { Config } from "../../src/shared/types/config.js";

describe('parseExportKeyFromPath()', () => {
  const emptyConfig: Config = {};

  it('transforms a lowercase path to an export key', () => {
    const path = 'a/b/c.function.js';
    const result = parseExportKeyFromPath(path, emptyConfig);
    expect(result).to.equal('a.b.c');
  });

  for (const [label, path] of [
    ['camelCase', 'events/fsTriggers/onEvent.function.js'],
    ['kebab-case', 'events/fs-triggers/on-event.function.js'],
    ['snake_case', 'events/fs_triggers/on_event.function.js'],
    ['a mix of cases', 'events/fsTriggers/on_event.function.js'],
  ] as const) {
    it(`transforms ${label} path to a camelCase export key`, () => {
      const result = parseExportKeyFromPath(path, emptyConfig);
      expect(result).to.equal('events.fsTriggers.onEvent');
    });
  }

  it('applies group transforms from config', () => {
    const path = 'redundant/path/to/file/yawn/someFunction.function.js';
    const groupTransformingConfig: Config = { ignoreGroups: ['redundant', 'yawn'] };
    const result = parseExportKeyFromPath(path, groupTransformingConfig);
    expect(result).to.equal('path.to.file.someFunction');
  });

  describe('when file extension is wrong', () => {
    it('throws if file extension is missing', () => {
      const path = 'foo/bar';
      expect(() => parseExportKeyFromPath(path, emptyConfig)).to.throw();
    });

    it('throws if the file does not use .js', () => {
      const path = 'foo/bar.function.ts';
      expect(() => parseExportKeyFromPath(path, emptyConfig)).to.throw();
    });

    it('throws if the file extension is the wrong format', () => {
      const path = 'foo/bar.js.function';
      expect(() => parseExportKeyFromPath(path, emptyConfig)).to.throw();
    });
  });
});

describe('parseFunctionIdFromPath()', () => {
  it('returns a lowercase function ID', () => {
    const path = 'primaryGroup/subGroup/myFunction.function.js';
    const result = parseFunctionIdFromPath(path, {});
    expect(result).to.equal('primarygroup.subgroup.myfunction');
  });
});

describe('Windows path handling', () => {
  const emptyConfig: Config = {};

  it('handles Windows-style backslash paths', () => {
    const path = 'group\\subgroup\\func.function.js';
    const result = parseExportKeyFromPath(path, emptyConfig);
    expect(result).to.equal('group.subgroup.func');
  });

  it('handles mixed slash styles', () => {
    const path = 'group/subgroup\\func.function.js';
    const result = parseExportKeyFromPath(path, emptyConfig);
    expect(result).to.equal('group.subgroup.func');
  });

  it('handles Windows paths with parseFunctionIdFromPath', () => {
    const path = 'primaryGroup\\subGroup\\myFunction.function.js';
    const result = parseFunctionIdFromPath(path, emptyConfig);
    expect(result).to.equal('primarygroup.subgroup.myfunction');
  });
});
