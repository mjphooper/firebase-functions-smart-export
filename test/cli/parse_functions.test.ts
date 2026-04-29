import { expect } from 'chai';
import { findDuplicateFunctions, findOversizedFunctions, parseExportKeyFromPath, parseFunctions, type ParsedFunction } from '../../src/cli/parse_functions.js';
import { Config } from '../../src/cli/config.js';

const fn = (exportKey: string, filePath = `${exportKey}.function.js`): ParsedFunction => ({ exportKey, filePath });

describe('parseExportKeyFromPath()', () => {
  const emptyConfig: Config = {};

  it('transforms a lowercase path to an export key', () => {
    const result = parseExportKeyFromPath('a/b/c.function.js', emptyConfig);
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
    const config: Config = { ignoreGroups: ['redundant', 'yawn'] };
    const result = parseExportKeyFromPath(path, config);
    expect(result).to.equal('path.to.file.someFunction');
  });

  describe('when file extension is wrong', () => {
    it('throws if file extension is missing', () => {
      expect(() => parseExportKeyFromPath('foo/bar', emptyConfig)).to.throw();
    });

    it('throws if the file does not use .js', () => {
      expect(() => parseExportKeyFromPath('foo/bar.function.ts', emptyConfig)).to.throw();
    });

    it('throws if the file extension is the wrong format', () => {
      expect(() => parseExportKeyFromPath('foo/bar.js.function', emptyConfig)).to.throw();
    });
  });

  describe('Windows path handling', () => {
    it('handles Windows-style backslash paths', () => {
      const result = parseExportKeyFromPath('group\\subgroup\\func.function.js', emptyConfig);
      expect(result).to.equal('group.subgroup.func');
    });

    it('handles mixed slash styles', () => {
      const result = parseExportKeyFromPath('group/subgroup\\func.function.js', emptyConfig);
      expect(result).to.equal('group.subgroup.func');
    });
  });
});

describe('parseFunctions()', () => {
  const emptyConfig: Config = {};

  it('returns an empty list when files are empty', () => {
    const functions = parseFunctions([], emptyConfig);

    expect(functions).to.have.lengthOf(0);
  });

  it('returns one parsed function per file, in order', () => {
    const files = ['a/b/c.function.js', 'd/e/f.function.js'];

    const functions = parseFunctions(files, emptyConfig);

    expect(functions).to.have.lengthOf(2);
    expect(functions[0].filePath).to.equal(files[0]);
    expect(functions[1].filePath).to.equal(files[1]);
  });

  it('stores unmodified file path on each parsed function', () => {
    const file = `a/b/c.function.js`;

    const functions = parseFunctions([file], emptyConfig);

    expect(functions[0].filePath).to.equal(file);
  });

  for (const [label, file] of [
    ['camelCase', 'events/fsTriggers/onEvent.function.js'],
    ['kebab-case', 'events/fs-triggers/on-event.function.js'],
    ['snake_case', 'events/fs_triggers/on_event.function.js'],
    ['a mix of cases', 'events/fsTriggers/on_event.function.js'],
  ] as const) {
    it(`derives the correct export key from ${label} file paths`, () => {
      const functions = parseFunctions([file], emptyConfig);

      expect(functions[0].exportKey).to.equal('events.fsTriggers.onEvent');
    });
  }
});

describe('findOversizedFunctions()', () => {
  it('returns an empty list when all keys are within the limit', () => {
    const result = findOversizedFunctions([fn('foo'), fn('bar')], 10);

    expect(result).to.have.lengthOf(0);
  });

  it('returns only the functions whose export key exceeds the limit', () => {
    const small = fn('ok');
    const large = fn('x'.repeat(20));

    const result = findOversizedFunctions([small, large], 10);

    expect(result).to.deep.equal([large]);
  });

  it('treats keys exactly at the limit as valid', () => {
    const exact = fn('x'.repeat(10));

    const result = findOversizedFunctions([exact], 10);

    expect(result).to.have.lengthOf(0);
  });
});

describe('findDuplicateFunctions()', () => {
  it('returns no groups when all export keys are unique', () => {
    const groups = findDuplicateFunctions([fn('foo'), fn('bar'), fn('baz')]);

    expect(groups).to.have.lengthOf(0);
  });

  it('returns no groups for an empty list', () => {
    expect(findDuplicateFunctions([])).to.have.lengthOf(0);
  });

  it('groups exact-match collisions', () => {
    const a = fn('sendMessage', 'a.function.js');
    const b = fn('sendMessage', 'b.function.js');

    const groups = findDuplicateFunctions([a, b]);

    expect(groups).to.deep.equal([[a, b]]);
  });

  it('groups case-only collisions', () => {
    const a = fn('sendMessage', 'a.function.js');
    const b = fn('sendmessage', 'b.function.js');

    const groups = findDuplicateFunctions([a, b]);

    expect(groups).to.deep.equal([[a, b]]);
  });

  it('returns groups of three or more when multiple files collide', () => {
    const a = fn('myFunc', 'a.function.js');
    const b = fn('MYFUNC', 'b.function.js');
    const c = fn('myfunc', 'c.function.js');

    const groups = findDuplicateFunctions([a, b, c]);

    expect(groups).to.deep.equal([[a, b, c]]);
  });

  it('reports multiple independent collision groups', () => {
    const a1 = fn('one', 'a1.function.js');
    const a2 = fn('ONE', 'a2.function.js');
    const b1 = fn('two', 'b1.function.js');
    const b2 = fn('TWO', 'b2.function.js');
    const unique = fn('three', 'three.function.js');

    const groups = findDuplicateFunctions([a1, b1, a2, unique, b2]);

    expect(groups).to.have.lengthOf(2);
    expect(groups).to.deep.include([a1, a2]);
    expect(groups).to.deep.include([b1, b2]);
  });
});
