import { getInstanceTargetId, getUnexpectedTargetNameErrorMessage } from '../../../src/runtime/helpers/get_instance_target_id';

type Env = {
  FUNCTION_TARGET?: string,
  K_SERVICE?: string,
}

it('replaces hypens with dots in result', () => {
  const env: Env = { FUNCTION_TARGET: 'raw-target-name' };
  const result = getInstanceTargetId(env);
  expect(result).toBe('raw.target.name');
});

it('returns the result in all lowercase', () => {
  const env: Env = { FUNCTION_TARGET: 'fooBar-functionName' };
  const result = getInstanceTargetId(env);
  expect(result).toBe('foobar.functionname');
});

it('prefers to return FUNCTION_TARGET if defined', () => {
  const env: Env = { FUNCTION_TARGET: 'preferred', K_SERVICE: 'other' };
  const result = getInstanceTargetId(env);
  expect(result).toBe('preferred');
});

it('falls back to K_SERVICE if FUNCTION_TARGET is undefined', () => {
  const env: Env = { K_SERVICE: 'fallback' };
  const result = getInstanceTargetId(env);
  expect(result).toBe('fallback');
});

it('returns null if neither FUNCTION_TARGET nor K_SERVICE is set', () => {
  const env: Env = {};
  const result = getInstanceTargetId(env);
  expect(result).toBeNull();
});

it('returns null if target is an empty string', () => {
  // Arrange
  const env: Env = { FUNCTION_TARGET: '', K_SERVICE: '' };
  const result = getInstanceTargetId(env);
  expect(result).toBeNull();
});

it('throws if target string does not match expected pattern', () => {
  // Arrange
  const targetName = 'weird_function_name';
  const env: Env = { FUNCTION_TARGET: targetName };

  // Act & Assert
  expect(() => getInstanceTargetId(env)).toThrow(
    getUnexpectedTargetNameErrorMessage(targetName),
  );
});