import { expect } from 'chai';
import { getInstanceTargetId, getUnexpectedTargetNameErrorMessage } from '../../src/runtime/get_instance_target_id.js';

type Env = {
  FUNCTION_TARGET?: string,
  K_SERVICE?: string,
}

it('replaces hypens with dots in result', () => {
  const env: Env = { FUNCTION_TARGET: 'raw-target-name' };
  const result = getInstanceTargetId(env);
  expect(result).to.equal('raw.target.name');
});

it('returns the result in all lowercase', () => {
  const env: Env = { FUNCTION_TARGET: 'fooBar-functionName' };
  const result = getInstanceTargetId(env);
  expect(result).to.equal('foobar.functionname');
});

it('prefers to return FUNCTION_TARGET if defined', () => {
  const env: Env = { FUNCTION_TARGET: 'preferred', K_SERVICE: 'other' };
  const result = getInstanceTargetId(env);
  expect(result).to.equal('preferred');
});

it('falls back to K_SERVICE if FUNCTION_TARGET is undefined', () => {
  const env: Env = { K_SERVICE: 'fallback' };
  const result = getInstanceTargetId(env);
  expect(result).to.equal('fallback');
});

it('returns null if neither FUNCTION_TARGET nor K_SERVICE is set', () => {
  const env: Env = {};
  const result = getInstanceTargetId(env);
  expect(result).to.be.null;
});

it('returns null if target is an empty string', () => {
  const env: Env = { FUNCTION_TARGET: '', K_SERVICE: '' };
  const result = getInstanceTargetId(env);
  expect(result).to.be.null;
});

it('throws if target string does not match expected pattern', () => {
  const targetName = 'weird_function_name';
  const env: Env = { FUNCTION_TARGET: targetName };
  expect(() => getInstanceTargetId(env)).to.throw(
    getUnexpectedTargetNameErrorMessage(targetName),
  );
});
