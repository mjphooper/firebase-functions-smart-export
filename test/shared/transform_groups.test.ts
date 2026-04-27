import { expect } from 'chai';
import { transformGroups } from "../../src/shared/transform_groups.js";
import { Config } from "../../src/shared/types/config.js";

it('has no effect when the config is empty', () => {
  const config: Config = {};

  const result = transformGroups(['foo', 'bar'], config);

  expect(result).to.deep.equal(['foo', 'bar']);
});

describe('when ignored groups are given', () => {
  it('removes ignored groups', () => {
    const config: Config = { ignoreGroups: ['ignored'] };

    const result = transformGroups(['foo', 'ignored', 'bar'], config);

    expect(result).to.deep.equal(['foo', 'bar']);
  });

  it('has no effect when the `ignoreGroups` array is empty', () => {
    const config: Config = { ignoreGroups: [] };

    const result = transformGroups(['foo', 'ignored', 'bar'], config);

    expect(result).to.deep.equal(['foo', 'ignored', 'bar']);
  });
});

describe('when a group mapping function is provided', () => {
  it('applies the group mapping function', () => {
    const config: Config = { mapGroups: groups => groups.map(g => g + '_mapped') };

    const result = transformGroups(['a', 'b'], config);

    expect(result).to.deep.equal(['a_mapped', 'b_mapped']);
  });

  it('applies the group mapping function last', () => {
    const groups = ['a', 'b', 'c', 'd'];
    const config: Config = {
      ignoreGroups: ['a', 'b'],
      maxGroupDepth: 1,
      mapGroups: groups => groups.map(g => g + '_mapped'),
    };

    const result = transformGroups(groups, config);

    expect(result).to.deep.equal(['c_mapped']);
  });
});

describe('when a max group depth is set', () => {
  it('limits group depth', () => {
    const groups = ['a', 'b', 'c'];
    const config: Config = { maxGroupDepth: 1 };

    const result = transformGroups(groups, config);

    expect(result).to.deep.equal(['a']);
  });

  for (const maxDepth of [0, -10, -Number.MAX_SAFE_INTEGER]) {
    it(`throws when the max depth is set to ${maxDepth}`, () => {
      const config: Config = { maxGroupDepth: maxDepth };

      expect(() => transformGroups([], config)).to.throw();
    });
  }
});

describe('when groups are disabled', () => {
  it('returns an empty array', () => {
    const groups = ['a', 'b', 'c'];
    const config: Config = {
      disableGroups: true,
      ignoreGroups: ['a'],
      maxGroupDepth: 1,
    };

    const result = transformGroups(groups, config);

    expect(result).to.have.lengthOf(0);
  });
});
