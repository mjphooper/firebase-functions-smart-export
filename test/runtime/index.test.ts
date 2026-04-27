import { expect } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';
import { buildExportMap } from '../../src/runtime/build_export_map.js';
import { createExportMap } from '../../src/runtime/index.js';

const fakeCloudFunction: object = { data: 'Hello, I am a Cloud Function.' };

const functionMap = {
  'target.function': 'lib/path/to/target.function.js',
  'other.function': 'lib/path/to/other.function.js',
};

function makeDeps(targetId: string | null) {
  return {
    getInstanceTargetId: sinon.stub().returns(targetId),
    importCloudFunction: sinon.stub().resolves(fakeCloudFunction),
    buildExportMap,
  };
}

describe('createExportMap()', () => {
  it('loads only the target function when one is provided', async () => {
    const deps = makeDeps('target.function');

    const result = await createExportMap(functionMap, deps);

    sinon.assert.calledOnce(deps.importCloudFunction);
    sinon.assert.calledWithMatch(deps.importCloudFunction, sinon.match(/target\.function\.js/));
    expect(result).to.deep.equal({ target: { function: fakeCloudFunction } });
  });

  it('loads all functions when no target is provided', async () => {
    const deps = makeDeps(null);

    const result = await createExportMap(functionMap, deps);

    sinon.assert.calledTwice(deps.importCloudFunction);
    expect(result).to.deep.equal({
      target: { function: fakeCloudFunction },
      other: { function: fakeCloudFunction },
    });
  });

  it('throws if target function is not found', async () => {
    const deps = makeDeps('not.registered');

    try {
      await createExportMap(functionMap, deps);
      throw new Error('Expected createExportMap to throw');
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
    }
  });

  it('matches targetId case-insensitively against camelCase export keys', async () => {
    const map = { 'auth.onCreate': 'lib/auth/onCreate.function.js' };
    const deps = makeDeps('auth.oncreate');

    const result = await createExportMap(map, deps);

    sinon.assert.calledOnce(deps.importCloudFunction);
    expect(result).to.deep.equal({ auth: { onCreate: fakeCloudFunction } });
  });
});
